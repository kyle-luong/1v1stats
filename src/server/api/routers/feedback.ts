/**
 * Feedback Router
 * tRPC procedures for feedback submission and admin management
 */

import { z } from "zod";
import { FeedbackType, FeedbackStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

export const feedbackRouter = createTRPCRouter({
  /**
   * Submit new feedback (public)
   * Allows users to report bugs, request features, or report data issues
   */
  submit: publicProcedure
    .input(
      z.object({
        type: z.nativeEnum(FeedbackType),
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(5000),
        email: z.string().email().optional().or(z.literal("")),
        name: z.string().max(100).optional().or(z.literal("")),
        relatedVideoId: z.string().optional(),
        relatedPlayerId: z.string().optional(),
        relatedGameId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.feedback.create({
        data: {
          type: input.type,
          title: input.title,
          description: input.description,
          email: input.email || null,
          name: input.name || null,
          relatedVideoId: input.relatedVideoId,
          relatedPlayerId: input.relatedPlayerId,
          relatedGameId: input.relatedGameId,
        },
      });

      return feedback;
    }),

  /**
   * Get all feedback with filters (admin only)
   */
  getAll: adminProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(FeedbackStatus).optional(),
          type: z.nativeEnum(FeedbackType).optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const feedback = await ctx.db.feedback.findMany({
        where: {
          status: input?.status,
          type: input?.type,
        },
        take: input?.limit ?? 50,
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          relatedVideo: {
            select: { id: true, title: true },
          },
          relatedPlayer: {
            select: { id: true, name: true },
          },
          relatedGame: {
            select: { id: true, player1: { select: { name: true } }, player2: { select: { name: true } } },
          },
        },
      });

      return feedback;
    }),

  /**
   * Get feedback stats for admin dashboard
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [unreviewed, resolved, closed] = await Promise.all([
      ctx.db.feedback.count({ where: { status: FeedbackStatus.UNREVIEWED } }),
      ctx.db.feedback.count({ where: { status: FeedbackStatus.RESOLVED } }),
      ctx.db.feedback.count({ where: { status: FeedbackStatus.CLOSED } }),
    ]);

    return {
      unreviewed,
      resolved,
      closed,
      total: unreviewed + resolved + closed,
    };
  }),

  /**
   * Update feedback status (admin only)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(FeedbackStatus),
        reviewedBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.feedback.update({
        where: { id: input.id },
        data: {
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: input.reviewedBy || ctx.user?.id || null,
        },
      });

      return feedback;
    }),

  /**
   * Add admin notes (admin only)
   */
  addNotes: adminProcedure
    .input(
      z.object({
        id: z.string(),
        adminNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.feedback.update({
        where: { id: input.id },
        data: {
          adminNotes: input.adminNotes,
        },
      });

      return feedback;
    }),

  /**
   * Delete feedback (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.feedback.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
