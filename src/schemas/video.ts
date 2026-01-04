// src/schemas/video.ts
// Video-related Zod schemas

import { z } from "zod";
import { VideoStatus } from "@prisma/client";
import { MAX_NOTE_LENGTH } from "@/constants/validation";
import { QUERY_LIMITS } from "@/constants/limits";
import { cuidSchema, optionalEmail, optionalString } from "./common";

/**
 * Video status enum schema
 */
export const videoStatusSchema = z.nativeEnum(VideoStatus);

/**
 * Video filter/list schema
 */
export const videoFilterSchema = z.object({
  channel: z.string().optional(),
  status: videoStatusSchema.optional(),
  limit: z.number().min(1).max(QUERY_LIMITS.VIDEOS_MAX).default(QUERY_LIMITS.VIDEOS_DEFAULT),
});

/**
 * Video ID input schema
 */
export const videoIdSchema = z.object({
  id: cuidSchema,
});

/**
 * Video submission schema (public)
 */
export const videoSubmitSchema = z.object({
  url: z.string().url(),
  youtubeId: z.string().length(11),
  title: z.string().min(1).max(200),
  channelName: z.string().min(1).max(100),
  thumbnailUrl: z.string().url().optional(),
  submitterEmail: optionalEmail,
  submitterNote: optionalString.pipe(z.string().max(MAX_NOTE_LENGTH).optional()),
});

/**
 * Video status update schema (admin only)
 */
export const videoStatusUpdateSchema = z.object({
  id: cuidSchema,
  status: videoStatusSchema,
});

/**
 * Inferred types from schemas
 */
export type VideoFilterInput = z.infer<typeof videoFilterSchema>;
export type VideoSubmitInput = z.infer<typeof videoSubmitSchema>;
export type VideoStatusUpdateInput = z.infer<typeof videoStatusUpdateSchema>;
