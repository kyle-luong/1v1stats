// src/constants/limits.ts
// API and pagination limits

/**
 * Default pagination limits
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  HOME_RECENT_GAMES: 6,
  HOME_FEATURED_MATCHUPS: 3,
} as const;

/**
 * Query limits for different endpoints
 */
export const QUERY_LIMITS = {
  VIDEOS_DEFAULT: 20,
  VIDEOS_MAX: 100,
  PLAYERS_DEFAULT: 50,
  PLAYERS_MAX: 100,
  GAMES_DEFAULT: 50,
  GAMES_MAX: 200,
} as const;

/**
 * Rate limiting (for future implementation)
 */
export const RATE_LIMITS = {
  VIDEO_SUBMISSIONS_PER_HOUR: 10,
  API_REQUESTS_PER_MINUTE: 100,
} as const;

/**
 * File size limits
 */
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
} as const;
