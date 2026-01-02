/**
 * tRPC Initialization
 * Sets up the tRPC server with context, procedures, and middleware
 */

import { TRPCError, initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../db";

/**
 * Creates context for each tRPC request
 * Includes database client and user session from Supabase
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  // Import here to avoid Edge runtime issues
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    db,
    user,
    headers: opts.req.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create router instance
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - accessible without authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be non-null
    },
  });
});

/**
 * Admin procedure - requires admin privileges
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Check if user is admin
  const dbUser = await ctx.db.user.findUnique({
    where: { id: ctx.user.id },
    select: { isAdmin: true },
  });

  if (!dbUser?.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
