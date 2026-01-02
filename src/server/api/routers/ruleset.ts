/**
 * Ruleset Router
 * tRPC procedures for game rulesets (scoring rules, formats, etc.)
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const rulesetRouter = createTRPCRouter({
  /**
   * Get all rulesets
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.ruleset.findMany({
      orderBy: {
        scoringTarget: "desc", // Higher scores first (30pts before 21pts)
      },
    });
  }),

  /**
   * Get ruleset by ID
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.ruleset.findUnique({
      where: { id: input.id },
    });
  }),
});
