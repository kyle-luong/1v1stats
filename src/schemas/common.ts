// src/schemas/common.ts
// Common Zod schemas used across the application

import { z } from "zod";

/**
 * CUID string schema (Prisma default ID format)
 */
export const cuidSchema = z.string().cuid();

/**
 * Pagination input schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Sort direction schema
 */
export const sortDirectionSchema = z.enum(["asc", "desc"]);

/**
 * Optional string that treats empty strings as undefined
 */
export const optionalString = z
  .string()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

/**
 * URL schema with optional empty string handling
 */
export const optionalUrl = z
  .string()
  .url()
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val));

/**
 * Email schema
 */
export const emailSchema = z.string().email();

/**
 * Optional email schema
 */
export const optionalEmail = z
  .string()
  .email()
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? undefined : val));
