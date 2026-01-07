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
   * Get total game count
   */
  getCount: publicProcedure.query(async ({ ctx }) => ctx.db.game.count()),

  /**
   * Get recent games with player and video info (for homepage)
   */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }).optional())
    .query(async ({ ctx, input }) =>
      ctx.db.game.findMany({
        take: input?.limit ?? 6,
        include: {
          video: true,
          player1: true,
          player2: true,
        },
        orderBy: {
          gameDate: "desc",
        },
      })
    ),

  /**
   * Get paginated games (infinite scroll)
   */
  getInfinite: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;
      const { cursor } = input;

      const items = await ctx.db.game.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          gameDate: "desc",
        },
        include: {
          video: true,
          player1: true,
          player2: true,
          ruleset: true,
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

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
        status: VideoStatus.PENDING,
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

        // Update video status to APPROVED
        await tx.video.update({
          where: { id: input.videoId },
          data: { status: VideoStatus.APPROVED },
        });

        return newGame;
      });

      return game;
    }),

  /**
   * Update game data (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        player1Id: z.string().optional(),
        player2Id: z.string().optional(),
        player1Score: z.number().int().min(0).optional(),
        player2Score: z.number().int().min(0).optional(),
        isOfficial: z.boolean().optional(),
        gameDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get current game to determine winner if scores changed
      const currentGame = await ctx.db.game.findUnique({
        where: { id },
      });

      if (!currentGame) {
        throw new Error("Game not found");
      }

      // Calculate new scores (use existing if not provided)
      const player1Score = updateData.player1Score ?? currentGame.player1Score;
      const player2Score = updateData.player2Score ?? currentGame.player2Score;
      const player1Id = updateData.player1Id ?? currentGame.player1Id;
      const player2Id = updateData.player2Id ?? currentGame.player2Id;

      // Validate no ties
      if (player1Score === player2Score) {
        throw new Error("Game cannot end in a tie. One player must win.");
      }

      // Validate different players
      if (player1Id === player2Id) {
        throw new Error("Cannot have the same player twice");
      }

      // Recalculate winner
      const winnerId = player1Score > player2Score ? player1Id : player2Id;

      return ctx.db.game.update({
        where: { id },
        data: {
          ...updateData,
          player1Id,
          player2Id,
          player1Score,
          player2Score,
          winnerId,
        },
        include: {
          player1: true,
          player2: true,
          video: true,
        },
      });
    }),

  /**
   * Delete game (admin only)
   * Options:
   * - deleteVideo: false → Keep video as FAILED (prevents re-submission)
   * - deleteVideo: true → Delete both game and video (allows re-submission)
   */
  delete: adminProcedure
    .input(
      z.object({
        id: z.string(),
        deleteVideo: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get game to find associated video
      const game = await ctx.db.game.findUnique({
        where: { id: input.id },
        select: { videoId: true },
      });

      if (!game) {
        throw new Error("Game not found");
      }

      await ctx.db.$transaction(async (tx) => {
        // Delete the game (cascade will delete stats)
        await tx.game.delete({
          where: { id: input.id },
        });

        if (input.deleteVideo) {
          // Completely remove video from DB (allows re-submission)
          await tx.video.delete({
            where: { id: game.videoId },
          });
        } else {
          // Mark video as rejected (prevents re-submission)
          await tx.video.update({
            where: { id: game.videoId },
            data: { status: VideoStatus.REJECTED },
          });
        }
      });

      return { success: true };
    }),
});
