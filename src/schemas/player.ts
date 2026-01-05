// src/schemas/player.ts
// Player-related Zod schemas

import { z } from "zod";
import { MAX_PLAYER_NAME_LENGTH, MAX_PLAYER_ALIASES } from "@/constants/validation";
import { optionalString, optionalUrl, cuidSchema } from "./common";

/**
 * Player search/filter input schema
 */
export const playerSearchSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

/**
 * Player ID input schema
 */
export const playerIdSchema = z.object({
  id: cuidSchema,
});

/**
 * Player creation schema
 */
export const playerCreateSchema = z.object({
  name: z.string().min(1).max(MAX_PLAYER_NAME_LENGTH),
  aliases: z.array(z.string()).max(MAX_PLAYER_ALIASES).default([]),
  instagramHandle: optionalString,
  height: optionalString,
  location: optionalString,
  imageUrl: optionalUrl,
});

/**
 * Player update schema (all fields optional except ID)
 */
export const playerUpdateSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(MAX_PLAYER_NAME_LENGTH).optional(),
  aliases: z.array(z.string()).max(MAX_PLAYER_ALIASES).optional(),
  instagramHandle: optionalString,
  height: optionalString,
  location: optionalString,
  imageUrl: optionalUrl,
});

/**
 * Inferred types from schemas
 */
export type PlayerSearchInput = z.infer<typeof playerSearchSchema>;
export type PlayerCreateInput = z.infer<typeof playerCreateSchema>;
export type PlayerUpdateInput = z.infer<typeof playerUpdateSchema>;
