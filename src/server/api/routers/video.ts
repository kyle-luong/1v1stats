/**
 * Video Router
 * tRPC procedures for video submission, listing, and status tracking
 */

import { z } from "zod";
import { VideoStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

// Simple in-memory rate limiter
const submissionRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

// Helper for sanitization
const sanitize = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const videoRouter = createTRPCRouter({
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
   * Submit a new video (authentication optional, links to user if logged in)
   */
  submit: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        youtubeId: z.string(),
        title: z.string(),
        channelName: z.string(),
        thumbnailUrl: z.string().url().optional(),
        submitterEmail: z.string().email().optional(),
        submitterNote: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Sanitization
      const sanitizedData = {
        ...input,
        title: sanitize(input.title),
        channelName: sanitize(input.channelName),
        submitterNote: input.submitterNote ? sanitize(input.submitterNote) : undefined,
      };

      return ctx.db.video.create({
        data: {
          ...sanitizedData,
          submittedById: ctx.user?.id, // Link to user if logged in
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
});
