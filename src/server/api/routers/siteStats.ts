// src/server/api/routers/siteStats.ts
// tRPC router for site-wide visit tracking

import { createTRPCRouter, publicProcedure } from "../trpc";

export const siteStatsRouter = createTRPCRouter({
  /**
   * Increment visit counter and return the new count
   * Uses upsert to create the singleton row if it doesn't exist
   */
  trackVisit: publicProcedure.mutation(async ({ ctx }) => {
    const stats = await ctx.db.siteStats.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", visits: 1 },
      update: { visits: { increment: 1 } },
    });
    return stats.visits;
  }),

  /**
   * Get current visit count without incrementing
   */
  getVisits: publicProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db.siteStats.findUnique({
      where: { id: "singleton" },
    });
    return stats?.visits ?? 0;
  }),
});


