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
 * Includes database client and (future) user session
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    db,
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
 * Protected procedure - requires authentication (to be implemented)
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // TODO: Add authentication check here
  // For now, allow all requests
  return next({
    ctx: {
      ...ctx,
      // session: session,
    },
  });
});
