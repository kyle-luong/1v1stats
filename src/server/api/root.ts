/**
 * Main tRPC Router
 * Combines all sub-routers into a single app router
 */

import { createTRPCRouter } from "./trpc";
import { playerRouter } from "./routers/player";
import { videoRouter } from "./routers/video";
import { gameRouter } from "./routers/game";
import { statRouter } from "./routers/stat";
import { rulesetRouter } from "./routers/ruleset";

/**
 * Main application router
 * All tRPC procedures are namespaced under their respective routers
 */
export const appRouter = createTRPCRouter({
  player: playerRouter,
  video: videoRouter,
  game: gameRouter,
  stat: statRouter,
  ruleset: rulesetRouter,
});

export type AppRouter = typeof appRouter;
