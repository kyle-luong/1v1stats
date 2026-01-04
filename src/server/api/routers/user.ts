// src/server/api/routers/user.ts
// tRPC router for User management

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  /**
   * Create a new user record in the database
   * Called after Supabase Auth signup to sync the user record
   */
  create: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the user record
      // This runs with Prisma admin privileges, bypassing RLS
      const user = await ctx.db.user.create({
        data: {
          id: input.id,
          email: input.email,
          name: input.name,
          isAdmin: false, // Enforce false by default
        },
      });

      return user;
    }),

  /**
   * Get the current user's profile
   */
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
    });
  }),
});
