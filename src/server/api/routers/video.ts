/**
 * Video Router
 * tRPC procedures for video submission, listing, and status tracking
 */

import { z } from "zod";
import { VideoStatus } from "@prisma/client";
import { fetchYoutubeMetadata } from "@/lib/youtube";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

// Simple in-memory rate limiter
const submissionRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

// Note: React automatically escapes output, so we don't need HTML entity encoding
// The sanitize function was causing double-encoding issues with YouTube titles

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
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          channel: z.string().optional(),
          status: z.nativeEnum(VideoStatus).optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      ctx.db.video.findMany({
        where: {
          channelName: input?.channel,
          status: input?.status,
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
      },
    })
  ),

  /**
   * Submit a new video with game info (authentication optional)
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
        // Game info (required for submission)
        player1Name: z.string().min(1),
        player2Name: z.string().min(1),
        player1Score: z.number().int().min(0),
        player2Score: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate scores are different (no ties)
      if (input.player1Score === input.player2Score) {
        throw new Error("Game cannot end in a tie. One player must win.");
      }

      // Rate Limiting (IP-based)
      const ip = ctx.headers.get("x-forwarded-for") || "unknown";
      const now = Date.now();
      const userRequests = submissionRateLimit.get(ip) || [];

      // Filter out old requests
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
          submitterEmail: input.submitterEmail,
          submitterNote: input.submitterNote || undefined,
          submittedById: ctx.user?.id,
          // Store submitted game info for admin review
          submittedPlayer1Name: input.player1Name,
          submittedPlayer2Name: input.player2Name,
          submittedPlayer1Score: input.player1Score,
          submittedPlayer2Score: input.player2Score,
        },
      });
    }),

  /**
   * Update video status (admin only)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(VideoStatus),
      })
    )
    .mutation(async ({ ctx, input }) =>
      ctx.db.video.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    ),

  /**
   * Get public video count (completed videos only)
   */
  getPublicCount: publicProcedure.query(async ({ ctx }) =>
    ctx.db.video.count({ where: { status: VideoStatus.COMPLETED } })
  ),

  /**
   * Get video stats (admin only)
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, pending, processing, completed, failed] = await Promise.all([
      ctx.db.video.count(),
      ctx.db.video.count({ where: { status: VideoStatus.PENDING } }),
      ctx.db.video.count({ where: { status: VideoStatus.PROCESSING } }),
      ctx.db.video.count({ where: { status: VideoStatus.COMPLETED } }),
      ctx.db.video.count({ where: { status: VideoStatus.FAILED } }),
    ]);

    return {
      total,
      byStatus: {
        pending,
        processing,
        completed,
        failed,
      },
    };
  }),

  /**
   * Get videos without games (admin only)
   * Used for game entry to show only videos that need processing
   */
  getVideosWithoutGames: adminProcedure.query(async ({ ctx }) =>
    ctx.db.video.findMany({
      where: {
        game: null,
        status: {
          in: [VideoStatus.PENDING, VideoStatus.PROCESSING],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ),

  /**
   * Approve video and create game in one step (admin only)
   * This is the unified approval flow
   */
  approveWithGame: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        player1Id: z.string(),
        player2Id: z.string(),
        player1Score: z.number().int().min(0),
        player2Score: z.number().int().min(0),
        isOfficial: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate players are different
      if (input.player1Id === input.player2Id) {
        throw new Error("Cannot create a game with the same player twice");
      }

      // Validate scores are different (no ties)
      if (input.player1Score === input.player2Score) {
        throw new Error("Game cannot end in a tie. One player must win.");
      }

      // Get the video to verify it exists and is pending
      const video = await ctx.db.video.findUnique({
        where: { id: input.videoId },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      if (video.status === VideoStatus.COMPLETED) {
        throw new Error("Video already has a game");
      }

      // Determine winner
      const winnerId = input.player1Score > input.player2Score ? input.player1Id : input.player2Id;

      // Use video upload date as game date, fallback to current date
      const gameDate = video.uploadedAt ?? new Date();

      // Create game and update video status in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create the game
        const game = await tx.game.create({
          data: {
            videoId: input.videoId,
            player1Id: input.player1Id,
            player2Id: input.player2Id,
            player1Score: input.player1Score,
            player2Score: input.player2Score,
            winnerId,
            isOfficial: input.isOfficial ?? false,
            gameDate,
            notes: input.notes,
          },
          include: {
            player1: true,
            player2: true,
            video: true,
          },
        });

        // Update video status to COMPLETED
        await tx.video.update({
          where: { id: input.videoId },
          data: {
            status: VideoStatus.COMPLETED,
            processedAt: new Date(),
          },
        });

        return game;
      });

      return result;
    }),

  /**
   * Reject a video submission (admin only)
   */
  reject: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) =>
    ctx.db.video.update({
      where: { id: input.id },
      data: { status: VideoStatus.FAILED },
    })
  ),

  /**
   * Delete a video completely (admin only)
   * Removes from DB entirely - allows re-submission of same YouTube video
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // This will cascade delete any associated game/stats
    await ctx.db.video.delete({
      where: { id: input.id },
    });
    return { success: true };
  }),

  /**
   * Re-open a rejected video for review (admin only)
   * Moves FAILED back to PENDING
   */
  reopen: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) =>
    ctx.db.video.update({
      where: { id: input.id },
      data: { status: VideoStatus.PENDING },
    })
  ),

  /**
   * Admin direct submission (admin only)
   * Creates video + game in one step, immediately approved
   * Skips the normal approval workflow
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
        player1Id: z.string(),
        player2Id: z.string(),
        player1Score: z.number().int().min(0),
        player2Score: z.number().int().min(0),
        isOfficial: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate players are different
      if (input.player1Id === input.player2Id) {
        throw new Error("Cannot create a game with the same player twice");
      }

      // Validate scores are different (no ties)
      if (input.player1Score === input.player2Score) {
        throw new Error("Game cannot end in a tie. One player must win.");
      }

      // Check if video already exists
      const existingVideo = await ctx.db.video.findUnique({
        where: { youtubeId: input.youtubeId },
      });

      if (existingVideo) {
        throw new Error("This video has already been submitted.");
      }

      // Determine winner
      const winnerId = input.player1Score > input.player2Score ? input.player1Id : input.player2Id;

      // Use video upload date as game date, fallback to current date
      const gameDate = input.uploadedAt ?? new Date();

      // Create video and game in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create the video (already approved)
        const video = await tx.video.create({
          data: {
            url: input.url,
            youtubeId: input.youtubeId,
            title: input.title,
            channelName: input.channelName,
            thumbnailUrl: input.thumbnailUrl,
            uploadedAt: input.uploadedAt,
            duration: input.duration,
            status: VideoStatus.COMPLETED,
            processedAt: new Date(),
            submittedById: ctx.user?.id,
          },
        });

        // Create the game
        const game = await tx.game.create({
          data: {
            videoId: video.id,
            player1Id: input.player1Id,
            player2Id: input.player2Id,
            player1Score: input.player1Score,
            player2Score: input.player2Score,
            winnerId,
            isOfficial: input.isOfficial ?? false,
            gameDate,
            notes: input.notes,
          },
          include: {
            player1: true,
            player2: true,
            video: true,
          },
        });

        return game;
      });

      return result;
    }),
});
