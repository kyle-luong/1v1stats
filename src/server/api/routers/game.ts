/**
 * Game Router
 * tRPC procedures for game management and statistics
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

const statInputSchema = z.object({
  points: z.number().int().min(0),
  fieldGoalsMade: z.number().int().min(0),
  fieldGoalsAttempted: z.number().int().min(0),
  threePointersMade: z.number().int().min(0),
  threePointersAttempted: z.number().int().min(0),
  freeThrowsMade: z.number().int().min(0),
  freeThrowsAttempted: z.number().int().min(0),
  rebounds: z.number().int().min(0),
  assists: z.number().int().min(0),
  steals: z.number().int().min(0),
  blocks: z.number().int().min(0),
  turnovers: z.number().int().min(0),
  fouls: z.number().int().min(0),
});

export const gameRouter = createTRPCRouter({
  /**
   * Get game by ID with full details
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.game.findUnique({
        where: { id: input.id },
        include: {
          video: true,
          player1: true,
          player2: true,
          stats: true,
        },
      });
    }),

  /**
   * Create a new game with stats
   */
  createWithStats: protectedProcedure
    .input(
      z.object({
        videoId: z.string(),
        player1Id: z.string(),
        player2Id: z.string(),
        player1Score: z.number().int().min(0),
        player2Score: z.number().int().min(0),
        player1Stats: statInputSchema,
        player2Stats: statInputSchema,
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { player1Stats, player2Stats, ...gameData } = input;

      // Determine winner
      const winnerId =
        input.player1Score > input.player2Score
          ? input.player1Id
          : input.player2Id;

      // Create game and stats in a transaction
      return ctx.db.game.create({
        data: {
          ...gameData,
          winnerId,
          stats: {
            create: [
              {
                playerId: input.player1Id,
                ...player1Stats,
              },
              {
                playerId: input.player2Id,
                ...player2Stats,
              },
            ],
          },
        },
        include: {
          player1: true,
          player2: true,
          stats: true,
          video: true,
        },
      });
    }),
});
