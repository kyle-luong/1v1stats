// src/constants/validation.ts
// Validation-related constants

/**
 * Maximum allowed score for a single game
 * Typical 1v1 games go to 21 or 30, but some formats go higher
 */
export const MAX_GAME_SCORE = 999;

/**
 * Minimum allowed score (cannot be negative)
 */
export const MIN_GAME_SCORE = 0;

/**
 * Maximum length for submitter notes
 */
export const MAX_NOTE_LENGTH = 500;

/**
 * Maximum length for player names
 */
export const MAX_PLAYER_NAME_LENGTH = 100;

/**
 * Maximum number of aliases per player
 */
export const MAX_PLAYER_ALIASES = 10;

/**
 * Valid YouTube URL patterns
 */
export const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
] as const;

/**
 * YouTube video ID length
 */
export const YOUTUBE_ID_LENGTH = 11;
