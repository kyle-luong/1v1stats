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
    .query(async ({ ctx, input }) =>
      ctx.db.player.findMany({
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
        include: {
          gamesAsPlayer1: {
            select: {
              id: true,
              winnerId: true,
              player1Id: true,
              player2Id: true,
              player1Score: true,
              player2Score: true,
            },
          },
          gamesAsPlayer2: {
            select: {
              id: true,
              winnerId: true,
              player1Id: true,
              player2Id: true,
              player1Score: true,
              player2Score: true,
            },
          },
        },
      })
    ),

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
        gamesAsPlayer1: {
          include: {
            player1: true,
            player2: true,
          },
        },
        gamesAsPlayer2: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
    });

    if (!player) {
      throw new Error("Player not found");
    }

    // Calculate basic stats
    const totalGames = player.gamesAsPlayer1.length + player.gamesAsPlayer2.length;
    const wins = [
      ...player.gamesAsPlayer1.filter((game) => game.winnerId === player.id),
      ...player.gamesAsPlayer2.filter((game) => game.winnerId === player.id),
    ].length;
    const losses = totalGames - wins;

    return {
      ...player,
      gamesPlayed: totalGames,
      wins,
      losses,
    };
  }),

  /**
   * Create a new player
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        aliases: z.array(z.string()).default([]),
        instagramHandle: z.string().optional(),
        height: z.string().optional(),
        position: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { imageUrl, ...data } = input;
      return ctx.db.player.create({
        data: {
          ...data,
          imageUrl: imageUrl || undefined,
        },
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
        aliases: z.array(z.string()).optional(),
        instagramHandle: z.string().optional(),
        height: z.string().optional(),
        position: z.string().optional(),
        location: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, imageUrl, ...data } = input;
      return ctx.db.player.update({
        where: { id },
        data: {
          ...data,
          imageUrl: imageUrl === "" ? null : imageUrl,
        },
      });
    }),

  /**
   * Delete a player
   * Note: This will cascade delete all related games and stats
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if player has games
      const player = await ctx.db.player.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              gamesAsPlayer1: true,
              gamesAsPlayer2: true,
              stats: true,
            },
          },
        },
      });

      if (!player) {
        throw new Error("Player not found");
      }

      const totalGames = player._count.gamesAsPlayer1 + player._count.gamesAsPlayer2;

      // Delete the player (cascade will handle related records)
      await ctx.db.player.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        deletedGames: totalGames,
        deletedStats: player._count.stats,
      };
    }),
});
