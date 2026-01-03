/**
 * Channel Router
 * tRPC procedures for managing whitelisted YouTube channels (Phase 1.5)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { extractChannelId, getChannelInfo } from "@/lib/youtube-api";
import { scrapeChannel } from "@/lib/channel-scraper";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

export const channelRouter = createTRPCRouter({
  /**
   * Get all whitelisted channels
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          whitelistedOnly: z.boolean().default(true),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.channel.findMany({
        where: input?.whitelistedOnly ? { isWhitelisted: true } : undefined,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { videos: true },
          },
        },
      })
    ),

  /**
   * Get channel by ID with video count
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) =>
      ctx.db.channel.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { videos: true },
          },
          videos: {
            take: 10,
            orderBy: { uploadedAt: "desc" },
          },
        },
      })
    ),

  /**
   * Add a new whitelisted channel (admin only)
   * Accepts YouTube channel URL, handle, or ID
   */
  create: adminProcedure
    .input(
      z.object({
        input: z.string().min(1), // URL, handle (@name), or channel ID
        scrapeFrequency: z.enum(["daily", "weekly", "manual"]).default("daily"),
        scrapeImmediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Extract channel ID from input
      const youtubeChannelId = await extractChannelId(input.input);

      if (!youtubeChannelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not extract YouTube channel ID from input. Please provide a valid channel URL, handle (@name), or channel ID.",
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

      // Fetch channel info from YouTube
      let channelInfo;
      try {
        channelInfo = await getChannelInfo(youtubeChannelId);
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Could not fetch channel info from YouTube. ${error instanceof Error ? error.message : ""}`,
        });
      }

      // Create channel record
      const channel = await ctx.db.channel.create({
        data: {
          youtubeChannelId: channelInfo.id,
          name: channelInfo.name,
          description: channelInfo.description,
          thumbnailUrl: channelInfo.thumbnailUrl,
          subscriberCount: channelInfo.subscriberCount,
          isWhitelisted: true,
          scrapeFrequency: input.scrapeFrequency,
        },
      });

      // Optionally scrape immediately
      let scrapeResult = null;
      if (input.scrapeImmediately) {
        scrapeResult = await scrapeChannel(ctx.db, channel.id);
      }

      return { channel, scrapeResult };
    }),

  /**
   * Update channel settings (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isWhitelisted: z.boolean().optional(),
        scrapeFrequency: z.enum(["daily", "weekly", "manual"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      ctx.db.channel.update({
        where: { id: input.id },
        data: {
          isWhitelisted: input.isWhitelisted,
          scrapeFrequency: input.scrapeFrequency,
        },
      })
    ),

  /**
   * Delete channel (admin only)
   * Note: This does not delete associated videos
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
   * Trigger manual scrape for a channel (admin only)
   */
  scrapeNow: adminProcedure
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

      const result = await scrapeChannel(ctx.db, input.id);
      return result;
    }),

  /**
   * Get scraping stats (admin only)
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, whitelisted, scrapedVideos] = await Promise.all([
      ctx.db.channel.count(),
      ctx.db.channel.count({ where: { isWhitelisted: true } }),
      ctx.db.video.count({ where: { scrapedAt: { not: null } } }),
    ]);

    // Get channels that need scraping
    const now = new Date();
    const needsScraping = await ctx.db.channel.count({
      where: {
        isWhitelisted: true,
        OR: [
          { lastScrapedAt: null },
          {
            scrapeFrequency: "daily",
            lastScrapedAt: {
              lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
          {
            scrapeFrequency: "weekly",
            lastScrapedAt: {
              lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    return {
      total,
      whitelisted,
      scrapedVideos,
      needsScraping,
    };
  }),
});
