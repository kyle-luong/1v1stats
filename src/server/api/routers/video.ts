/**
 * Video Router
 * tRPC procedures for video submission, listing, and status tracking
 */

import { z } from "zod";
import { VideoStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

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
    .mutation(async ({ ctx, input }) =>
      ctx.db.video.create({
        data: {
          ...input,
          submittedById: ctx.user?.id, // Link to user if logged in
        },
      })
    ),

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
});
