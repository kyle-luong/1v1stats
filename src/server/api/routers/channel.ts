/**
 * Channel Router
 * tRPC procedures for managing whitelisted YouTube channels (Phase 1.5)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { extractChannelId, getChannelInfo } from "@/lib/youtube-api";
import { scrapeChannel, addChannel } from "@/lib/channel-scraper";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
  /**
   * Get all channels (public - for displaying channel list)
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          activeOnly: z.boolean().default(true),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.channel.findMany({
        where: input?.activeOnly ? { isActive: true } : undefined,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { videos: true },
          },
        },
      })
    ),

  /**
   * Get channel by ID with video count and recent videos
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) =>
    ctx.db.channel.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: { videos: true },
        },
        videos: {
          take: 20,
          orderBy: { uploadedAt: "desc" },
        },
      },
    })
  ),

  /**
   * Add a new channel (admin only)
   * Accepts YouTube channel URL, handle, or ID
   */
  create: adminProcedure
    .input(
      z.object({
        input: z.string().min(1), // URL, handle (@name), or channel ID
        scrapeFrequency: z.enum(["daily", "manual"]).default("daily"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Extract channel ID from input
      const youtubeChannelId = await extractChannelId(input.input);

      if (!youtubeChannelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not find YouTube channel. Please provide a valid channel URL, handle (@name), or channel ID.",
        });
      }

      // Check if channel already exists
      const existing = await ctx.db.channel.findUnique({
        where: { youtubeChannelId },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Channel "${existing.name}" is already in the system.`,
        });
      }

      // Add channel (fetches info from YouTube)
      try {
        const result = await addChannel(ctx.db, youtubeChannelId, {
          scrapeFrequency: input.scrapeFrequency,
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Could not fetch channel info from YouTube. ${error instanceof Error ? error.message : ""}`,
        });
      }
    }),

  /**
   * Update channel settings (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        scrapeFrequency: z.enum(["daily", "manual"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      ctx.db.channel.update({
        where: { id: input.id },
        data: {
          isActive: input.isActive,
          scrapeFrequency: input.scrapeFrequency,
        },
      })
    ),

  /**
   * Delete channel (admin only)
   * Note: This does not delete associated videos, just unlinks them
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // First unlink videos from this channel
    await ctx.db.video.updateMany({
      where: { channelId: input.id },
      data: { channelId: null },
    });

    return ctx.db.channel.delete({
      where: { id: input.id },
    });
  }),

  /**
   * Scrape all videos from a channel (admin only)
   * Used for initial bulk import - fetches entire channel history
   */
  scrapeAll: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.id },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Full scrape - fetch all videos regardless of lastScrapedAt
      const result = await scrapeChannel(ctx.db, input.id, { fullScrape: true });
      return result;
    }),

  /**
   * Scrape new videos from a channel (admin only)
   * Only fetches videos since last scrape - used for incremental updates
   */
  scrapeNew: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const channel = await ctx.db.channel.findUnique({
      where: { id: input.id },
    });

    if (!channel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Channel not found",
      });
    }

    // Incremental scrape - only new videos since lastScrapedAt
    const result = await scrapeChannel(ctx.db, input.id, { fullScrape: false });
    return result;
  }),

  /**
   * Get scraping stats (admin only)
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, active, scrapedVideos, uncategorizedVideos] = await Promise.all([
      ctx.db.channel.count(),
      ctx.db.channel.count({ where: { isActive: true } }),
      ctx.db.video.count({ where: { scrapedAt: { not: null } } }),
      ctx.db.video.count({ where: { status: "SCRAPED", category: "UNCATEGORIZED" } }),
    ]);

    // Get channels that haven't been scraped in 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const needsScraping = await ctx.db.channel.count({
      where: {
        isActive: true,
        scrapeFrequency: "daily",
        OR: [{ lastScrapedAt: null }, { lastScrapedAt: { lt: oneDayAgo } }],
      },
    });

    return {
      total,
      active,
      scrapedVideos,
      uncategorizedVideos,
      needsScraping,
    };
  }),

  /**
   * Preview channel info before adding (admin only)
   * Useful for verifying the right channel was found
   */
  preview: adminProcedure
    .input(z.object({ input: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const youtubeChannelId = await extractChannelId(input.input);

      if (!youtubeChannelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not find YouTube channel from the provided input.",
        });
      }

      try {
        const info = await getChannelInfo(youtubeChannelId);
        return info;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Could not fetch channel info. ${error instanceof Error ? error.message : ""}`,
        });
      }
    }),
});

