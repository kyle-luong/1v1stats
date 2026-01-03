/**
 * Game Router
 * tRPC procedures for game management and statistics
 */

import { z } from "zod";
import { VideoStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";

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
   * Get all games
   */
  getAll: publicProcedure.query(async ({ ctx }) =>
    ctx.db.game.findMany({
      include: {
        video: true,
        player1: true,
        player2: true,
        ruleset: true,
      },
      orderBy: {
        gameDate: "desc",
      },
    })
  ),

  /**
   * Get game by ID with full details
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) =>
    ctx.db.game.findUnique({
      where: { id: input.id },
      include: {
        video: true,
        player1: true,
        player2: true,
        stats: true,
        ruleset: true,
      },
    })
  ),

  /**
   * Get videos that don't have games yet (for admin dropdown)
   */
  getVideosWithoutGames: adminProcedure.query(async ({ ctx }) => {
    const videos = await ctx.db.video.findMany({
      where: {
        status: VideoStatus.PROCESSING,
        game: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return videos;
  }),

  /**
   * Create a new game with stats (admin only)
   */
  createWithStats: adminProcedure
    .input(
      z.object({
        videoId: z.string(),
        player1Id: z.string(),
        player2Id: z.string(),
        player1Score: z.number().int().min(0),
        player2Score: z.number().int().min(0),
        player1Stats: statInputSchema,
        player2Stats: statInputSchema,
        rulesetId: z.string().optional(),
        isOfficial: z.boolean().optional(),
        courtType: z.enum(["INDOOR", "OUTDOOR", "UNKNOWN"]).optional(),
        gameDate: z.date().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { player1Stats, player2Stats, ...gameData } = input;

      // Validate that players are different
      if (input.player1Id === input.player2Id) {
        throw new Error("Cannot create a game with the same player twice");
      }

      // Validate that scores are not equal (ties not allowed)
      if (input.player1Score === input.player2Score) {
        throw new Error("Game cannot end in a tie. One player must win.");
      }

      // Determine winner
      const winnerId = input.player1Score > input.player2Score ? input.player1Id : input.player2Id;

      // Create game and stats, then update video status in a transaction
      const game = await ctx.db.$transaction(async (tx) => {
        // Create the game with stats
        const newGame = await tx.game.create({
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

        // Update video status to COMPLETED
        await tx.video.update({
          where: { id: input.videoId },
          data: { status: VideoStatus.COMPLETED },
        });

        return newGame;
      });

      return game;
    }),
});
