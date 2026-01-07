/**
 * Video Router
 * tRPC procedures for video submission, listing, categorization, and status tracking
 * Supports both user-submitted videos and scraped videos from whitelisted channels
 */

import { z } from "zod";
import { VideoStatus, VideoCategory } from "@prisma/client";
import { fetchYoutubeMetadata } from "@/lib/youtube";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

// Simple in-memory rate limiter
const submissionRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

export const videoRouter = createTRPCRouter({
  /**
   * Fetch YouTube video metadata from video ID
   * Used to auto-populate submission form
   */
  getYoutubeMetadata: publicProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await fetchYoutubeMetadata(input.videoId);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch video metadata");
      }
    }),

  /**
   * Get all videos with optional filters
   * Public endpoint - returns videos based on status/category
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          channel: z.string().optional(),
          status: z.nativeEnum(VideoStatus).optional(),
          category: z.nativeEnum(VideoCategory).optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.video.findMany({
        where: {
          channelName: input?.channel,
          status: input?.status,
          category: input?.category,
        },
        take: input?.limit ?? 20,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          game: {
            include: {
              player1: true,
              player2: true,
            },
          },
        },
      })
    ),

  /**
   * Get public videos (SCRAPED + APPROVED)
   * For /videos page - shows all publicly visible content
   */
  getPublicVideos: publicProcedure
    .input(
      z
        .object({
          category: z.nativeEnum(VideoCategory).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.video.findMany({
        where: {
          status: { in: [VideoStatus.SCRAPED, VideoStatus.APPROVED] },
          category: input?.category,
        },
        take: input?.limit ?? 50,
        orderBy: {
          uploadedAt: "desc",
        },
        include: {
          game: {
            include: {
              player1: true,
              player2: true,
            },
          },
          channel: {
            select: { name: true, thumbnailUrl: true },
          },
        },
      })
    ),

  /**
   * Get scraped videos awaiting contribution
   * For /submit page carousel - shows SCRAPED + UNCATEGORIZED videos
   */
  getScrapedVideos: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.video.findMany({
        where: {
          status: VideoStatus.SCRAPED,
          category: VideoCategory.UNCATEGORIZED,
        },
        take: input?.limit ?? 20,
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          youtubeId: true,
          url: true,
          title: true,
          channelName: true,
          thumbnailUrl: true,
          uploadedAt: true,
          duration: true,
        },
      })
    ),

  /**
   * Get video by ID
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) =>
    ctx.db.video.findUnique({
      where: { id: input.id },
      include: {
        game: {
          include: {
            player1: true,
            player2: true,
            stats: true,
          },
        },
        channel: true,
      },
    })
  ),

  /**
   * Submit a new video with game info (user submission flow)
   * Creates video with PENDING status for admin review
   */
  submit: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        youtubeId: z.string(),
        title: z.string(),
        channelName: z.string(),
        thumbnailUrl: z.string().url().optional(),
        uploadedAt: z.date().optional(),
        duration: z.number().int().optional(),
        submitterEmail: z.string().email().optional(),
        submitterNote: z.string().max(500).optional(),
        // Category info
        category: z.nativeEnum(VideoCategory),
        isCompetitive: z.boolean().optional(),
        // Game info (required for 1v1)
        player1Name: z.string().min(1).optional(),
        player2Name: z.string().min(1).optional(),
        player1Score: z.number().int().min(0).optional(),
        player2Score: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate 1v1 submissions have required game data
      if (input.category === VideoCategory.ONE_V_ONE) {
        if (!input.player1Name || !input.player2Name) {
          throw new Error("1v1 submissions require both player names");
        }
        if (input.player1Score === undefined || input.player2Score === undefined) {
          throw new Error("1v1 submissions require both player scores");
        }
        if (input.player1Score === input.player2Score) {
          throw new Error("Game cannot end in a tie. One player must win.");
        }
      }

      // Rate Limiting (IP-based)
      const ip = ctx.headers.get("x-forwarded-for") || "unknown";
      const now = Date.now();
      const userRequests = submissionRateLimit.get(ip) || [];
      const recentRequests = userRequests.filter((time) => now - time < RATE_LIMIT_WINDOW);

      if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      submissionRateLimit.set(ip, [...recentRequests, now]);

      // Check if video already exists
      const existingVideo = await ctx.db.video.findUnique({
        where: { youtubeId: input.youtubeId },
      });

      if (existingVideo) {
        throw new Error("This video has already been submitted.");
      }

      return ctx.db.video.create({
        data: {
          url: input.url,
          youtubeId: input.youtubeId,
          title: input.title,
          channelName: input.channelName,
          thumbnailUrl: input.thumbnailUrl,
          uploadedAt: input.uploadedAt,
          duration: input.duration,
          status: VideoStatus.PENDING,
          category: VideoCategory.UNCATEGORIZED, // Admin will confirm
          submitterEmail: input.submitterEmail,
          submitterNote: input.submitterNote,
          submittedById: ctx.user?.id,
          // Store submitted data for admin review
          submittedCategory: input.category,
          submittedIsCompetitive: input.isCompetitive ?? false,
          submittedPlayer1Name: input.player1Name,
          submittedPlayer2Name: input.player2Name,
          submittedPlayer1Score: input.player1Score,
          submittedPlayer2Score: input.player2Score,
        },
      });
    }),

  /**
   * Submit data for an existing scraped video (contribution flow)
   * Updates a SCRAPED video to PENDING with user-submitted data
   */
  submitDataForVideo: publicProcedure
    .input(
      z.object({
        videoId: z.string(),
        submitterEmail: z.string().email().optional(),
        submitterNote: z.string().max(500).optional(),
        // Category info
        category: z.nativeEnum(VideoCategory),
        isCompetitive: z.boolean().optional(),
        // Game info (required for 1v1)
        player1Name: z.string().min(1).optional(),
        player2Name: z.string().min(1).optional(),
        player1Score: z.number().int().min(0).optional(),
        player2Score: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate 1v1 submissions have required game data
      if (input.category === VideoCategory.ONE_V_ONE) {
        if (!input.player1Name || !input.player2Name) {
          throw new Error("1v1 submissions require both player names");
        }
        if (input.player1Score === undefined || input.player2Score === undefined) {
          throw new Error("1v1 submissions require both player scores");
        }
        if (input.player1Score === input.player2Score) {
          throw new Error("Game cannot end in a tie. One player must win.");
        }
      }

      // Rate Limiting
      const ip = ctx.headers.get("x-forwarded-for") || "unknown";
      const now = Date.now();
      const userRequests = submissionRateLimit.get(ip) || [];
      const recentRequests = userRequests.filter((time) => now - time < RATE_LIMIT_WINDOW);

      if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      submissionRateLimit.set(ip, [...recentRequests, now]);

      // Get the video
      const video = await ctx.db.video.findUnique({
        where: { id: input.videoId },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      if (video.status !== VideoStatus.SCRAPED) {
        throw new Error("This video already has a submission pending or is already categorized");
      }

      // Update video with submitted data
      return ctx.db.video.update({
        where: { id: input.videoId },
        data: {
          status: VideoStatus.PENDING,
          submitterEmail: input.submitterEmail,
          submitterNote: input.submitterNote,
          submittedById: ctx.user?.id,
          submittedCategory: input.category,
          submittedIsCompetitive: input.isCompetitive ?? false,
          submittedPlayer1Name: input.player1Name,
          submittedPlayer2Name: input.player2Name,
          submittedPlayer1Score: input.player1Score,
          submittedPlayer2Score: input.player2Score,
        },
      });
    }),

  /**
   * Approve video and create game for 1v1 (admin only)
   */
  approveWithGame: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        category: z.nativeEnum(VideoCategory),
        isCompetitive: z.boolean(),
        // Required for 1v1
        player1Id: z.string().optional(),
        player2Id: z.string().optional(),
        player1Score: z.number().int().min(0).optional(),
        player2Score: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate 1v1 approvals have required game data
      if (input.category === VideoCategory.ONE_V_ONE) {
        if (!input.player1Id || !input.player2Id) {
          throw new Error("1v1 approval requires both players to be selected");
        }
        if (input.player1Score === undefined || input.player2Score === undefined) {
          throw new Error("1v1 approval requires both player scores");
        }
        if (input.player1Id === input.player2Id) {
          throw new Error("Cannot create a game with the same player twice");
        }
        if (input.player1Score === input.player2Score) {
          throw new Error("Game cannot end in a tie. One player must win.");
        }
      }

      const video = await ctx.db.video.findUnique({
        where: { id: input.videoId },
        include: { game: true },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      if (video.status === VideoStatus.APPROVED && video.game) {
        throw new Error("Video is already approved with a game");
      }

      // For 1v1, create game in transaction
      if (input.category === VideoCategory.ONE_V_ONE) {
        const winnerId =
          input.player1Score! > input.player2Score! ? input.player1Id! : input.player2Id!;
        const gameDate = video.uploadedAt ?? new Date();

        return ctx.db.$transaction(async (tx) => {
          const game = await tx.game.create({
            data: {
              videoId: input.videoId,
              player1Id: input.player1Id!,
              player2Id: input.player2Id!,
              player1Score: input.player1Score!,
              player2Score: input.player2Score!,
              winnerId,
              isOfficial: input.isCompetitive,
              gameDate,
              notes: input.notes,
              source: video.scrapedAt ? "SCRAPED" : "SUBMITTED",
            },
            include: {
              player1: true,
              player2: true,
              video: true,
            },
          });

          await tx.video.update({
            where: { id: input.videoId },
            data: {
              status: VideoStatus.APPROVED,
              category: input.category,
              isCompetitive: input.isCompetitive,
              processedAt: new Date(),
            },
          });

          return game;
        });
      }

      // For non-1v1, just update status and category
      return ctx.db.video.update({
        where: { id: input.videoId },
        data: {
          status: VideoStatus.APPROVED,
          category: input.category,
          isCompetitive: false,
          processedAt: new Date(),
        },
      });
    }),

  /**
   * Quick categorize a scraped video (admin only)
   * For non-1v1 videos that don't need game data
   */
  categorize: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        category: z.nativeEnum(VideoCategory),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.category === VideoCategory.ONE_V_ONE) {
        throw new Error("Use approveWithGame for 1v1 videos");
      }

      return ctx.db.video.update({
        where: { id: input.videoId },
        data: {
          status: VideoStatus.APPROVED,
          category: input.category,
          isCompetitive: false,
          processedAt: new Date(),
        },
      });
    }),

  /**
   * Admin direct submission (admin only)
   * Creates video + game in one step, immediately approved
   */
  adminSubmit: adminProcedure
    .input(
      z.object({
        url: z.string().url(),
        youtubeId: z.string(),
        title: z.string(),
        channelName: z.string(),
        thumbnailUrl: z.string().url().optional(),
        uploadedAt: z.date().optional(),
        duration: z.number().int().optional(),
        category: z.nativeEnum(VideoCategory),
        isCompetitive: z.boolean(),
        // For 1v1
        player1Id: z.string().optional(),
        player2Id: z.string().optional(),
        player1Score: z.number().int().min(0).optional(),
        player2Score: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate 1v1 submissions
      if (input.category === VideoCategory.ONE_V_ONE) {
        if (!input.player1Id || !input.player2Id) {
          throw new Error("1v1 requires both players");
        }
        if (input.player1Score === undefined || input.player2Score === undefined) {
          throw new Error("1v1 requires both scores");
        }
        if (input.player1Id === input.player2Id) {
          throw new Error("Cannot create a game with the same player twice");
        }
        if (input.player1Score === input.player2Score) {
          throw new Error("Game cannot end in a tie");
        }
      }

      // Check if video already exists
      const existingVideo = await ctx.db.video.findUnique({
        where: { youtubeId: input.youtubeId },
      });

      if (existingVideo) {
        throw new Error("This video has already been submitted.");
      }

      const gameDate = input.uploadedAt ?? new Date();

      // Create video (and game if 1v1) in transaction
      return ctx.db.$transaction(async (tx) => {
        const video = await tx.video.create({
          data: {
            url: input.url,
            youtubeId: input.youtubeId,
            title: input.title,
            channelName: input.channelName,
            thumbnailUrl: input.thumbnailUrl,
            uploadedAt: input.uploadedAt,
            duration: input.duration,
            status: VideoStatus.APPROVED,
            category: input.category,
            isCompetitive: input.isCompetitive,
            processedAt: new Date(),
            submittedById: ctx.user?.id,
          },
        });

        if (input.category === VideoCategory.ONE_V_ONE) {
          const winnerId =
            input.player1Score! > input.player2Score! ? input.player1Id! : input.player2Id!;

          const game = await tx.game.create({
            data: {
              videoId: video.id,
              player1Id: input.player1Id!,
              player2Id: input.player2Id!,
              player1Score: input.player1Score!,
              player2Score: input.player2Score!,
              winnerId,
              isOfficial: input.isCompetitive,
              gameDate,
              notes: input.notes,
              source: "SUBMITTED",
            },
            include: {
              player1: true,
              player2: true,
              video: true,
            },
          });

          return game;
        }

        return video;
      });
    }),

  /**
   * Get public video count (approved videos only)
   */
  getPublicCount: publicProcedure.query(async ({ ctx }) =>
    ctx.db.video.count({ where: { status: VideoStatus.APPROVED } })
  ),

  /**
   * Get video stats (admin only)
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, scraped, pending, approved, rejected] = await Promise.all([
      ctx.db.video.count(),
      ctx.db.video.count({ where: { status: VideoStatus.SCRAPED } }),
      ctx.db.video.count({ where: { status: VideoStatus.PENDING } }),
      ctx.db.video.count({ where: { status: VideoStatus.APPROVED } }),
      ctx.db.video.count({ where: { status: VideoStatus.REJECTED } }),
    ]);

    // Category breakdown for approved videos
    const categoryBreakdown = await ctx.db.video.groupBy({
      by: ["category"],
      where: { status: VideoStatus.APPROVED },
      _count: true,
    });

    return {
      total,
      byStatus: {
        scraped,
        pending,
        approved,
        rejected,
      },
      byCategory: categoryBreakdown.reduce(
        (acc, item) => {
          acc[item.category] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }),

  /**
   * Reject a video submission (admin only)
   */
  reject: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) =>
    ctx.db.video.update({
      where: { id: input.id },
      data: { status: VideoStatus.REJECTED },
    })
  ),

  /**
   * Delete a video completely (admin only)
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.video.delete({
      where: { id: input.id },
    });
    return { success: true };
  }),

  /**
   * Re-open a rejected video for review (admin only)
   */
  reopen: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const video = await ctx.db.video.findUnique({ where: { id: input.id } });
    if (!video) throw new Error("Video not found");

    // If it was scraped, go back to SCRAPED, otherwise PENDING
    const newStatus = video.scrapedAt ? VideoStatus.SCRAPED : VideoStatus.PENDING;

    return ctx.db.video.update({
      where: { id: input.id },
      data: {
        status: newStatus,
        category: VideoCategory.UNCATEGORIZED,
      },
    });
  }),
});
