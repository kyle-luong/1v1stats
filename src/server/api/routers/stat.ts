/**
 * Stat Router
 * tRPC procedures for statistics aggregation and leaderboards
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const statRouter = createTRPCRouter({
  /**
   * Get career stats for a player
   */
  getCareerStats: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.stat.findMany({
        where: { playerId: input.playerId },
        include: {
          game: {
            include: {
              player1: true,
              player2: true,
            },
          },
        },
      });

      // Calculate aggregated stats
      const totalGames = stats.length;
      const totalPoints = stats.reduce((sum, s) => sum + s.points, 0);
      const totalRebounds = stats.reduce((sum, s) => sum + s.rebounds, 0);
      const totalAssists = stats.reduce((sum, s) => sum + s.assists, 0);
      const totalFGM = stats.reduce((sum, s) => sum + s.fieldGoalsMade, 0);
      const totalFGA = stats.reduce((sum, s) => sum + s.fieldGoalsAttempted, 0);

      return {
        gamesPlayed: totalGames,
        ppg: totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : "0.0",
        rpg: totalGames > 0 ? (totalRebounds / totalGames).toFixed(1) : "0.0",
        apg: totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : "0.0",
        fgPercentage: totalFGA > 0 ? ((totalFGM / totalFGA) * 100).toFixed(1) : "0.0",
        totalPoints,
        totalRebounds,
        totalAssists,
      };
    }),

  /**
   * Get leaderboard for a specific stat
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        statType: z.enum(["points", "rebounds", "assists", "steals", "blocks"]),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all stats grouped by player
      const stats = await ctx.db.stat.groupBy({
        by: ["playerId"],
        _sum: {
          points: true,
          rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            [input.statType]: "desc",
          },
        },
        take: input.limit,
      });

      // Get player details
      const playerIds = stats.map((s) => s.playerId);
      const players = await ctx.db.player.findMany({
        where: {
          id: {
            in: playerIds,
          },
        },
      });

      const playerMap = new Map(players.map((p) => [p.id, p]));

      return stats.map((stat) => ({
        player: playerMap.get(stat.playerId)!,
        gamesPlayed: stat._count.id,
        totalPoints: stat._sum.points ?? 0,
        totalRebounds: stat._sum.rebounds ?? 0,
        totalAssists: stat._sum.assists ?? 0,
        totalSteals: stat._sum.steals ?? 0,
        totalBlocks: stat._sum.blocks ?? 0,
        ppg: stat._count.id > 0 ? ((stat._sum.points ?? 0) / stat._count.id).toFixed(1) : "0.0",
      }));
    }),
});
