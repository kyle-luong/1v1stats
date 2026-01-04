// src/schemas/game.ts
// Game-related Zod schemas

import { z } from "zod";
import { MAX_GAME_SCORE, MIN_GAME_SCORE } from "@/constants/validation";
import { cuidSchema, optionalString } from "./common";

/**
 * Court type enum schema
 */
export const courtTypeSchema = z.enum(["INDOOR", "OUTDOOR", "UNKNOWN"]);

/**
 * Basketball stat input schema (for individual player stats in a game)
 */
export const statInputSchema = z.object({
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

/**
 * Game score schema
 */
export const gameScoreSchema = z.number().int().min(MIN_GAME_SCORE).max(MAX_GAME_SCORE);

/**
 * Game ID input schema
 */
export const gameIdSchema = z.object({
  id: cuidSchema,
});

/**
 * Recent games query schema
 */
export const recentGamesSchema = z.object({
  limit: z.number().min(1).max(20).default(6),
});

/**
 * Game creation schema (admin only)
 */
export const gameCreateSchema = z.object({
  videoId: cuidSchema,
  player1Id: cuidSchema,
  player2Id: cuidSchema,
  player1Score: gameScoreSchema,
  player2Score: gameScoreSchema,
  player1Stats: statInputSchema,
  player2Stats: statInputSchema,
  rulesetId: cuidSchema.optional(),
  isOfficial: z.boolean().optional(),
  courtType: courtTypeSchema.optional(),
  gameDate: z.date().optional(),
  location: optionalString,
  notes: optionalString,
});

/**
 * Inferred types from schemas
 */
export type StatInput = z.infer<typeof statInputSchema>;
export type GameCreateInput = z.infer<typeof gameCreateSchema>;
export type CourtType = z.infer<typeof courtTypeSchema>;
