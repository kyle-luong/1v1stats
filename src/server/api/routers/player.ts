/**
 * Player Router
 * tRPC procedures for player CRUD operations, statistics, and leaderboards
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const playerRouter = createTRPCRouter({
  /**
   * Get all players with optional search
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.player.findMany({
        where: input?.search
          ? {
              name: {
                contains: input.search,
                mode: "insensitive",
              },
            }
          : undefined,
        take: input?.limit ?? 50,
        orderBy: {
          name: "asc",
        },
      });
    }),

  /**
   * Get player by ID with full stats
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const player = await ctx.db.player.findUnique({
      where: { id: input.id },
      include: {
        stats: {
          include: {
            game: {
              include: {
                video: true,
                player1: true,
                player2: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      throw new Error("Player not found");
    }

    return player;
  }),

  /**
   * Create a new player
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        instagramHandle: z.string().optional(),
        height: z.string().optional(),
        position: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.player.create({
        data: input,
      });
    }),

  /**
   * Update player information
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        instagramHandle: z.string().optional(),
        height: z.string().optional(),
        position: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.player.update({
        where: { id },
        data,
      });
    }),
});
