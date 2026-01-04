// src/constants/routes.ts
// Application route paths

/**
 * Public routes accessible without authentication
 */
export const PUBLIC_ROUTES = {
  HOME: "/",
  GAMES: "/games",
  GAME_DETAIL: (id: string) => `/games/${id}`,
  PLAYERS: "/players",
  PLAYER_DETAIL: (id: string) => `/players/${id}`,
  VIDEOS: "/videos",
  SUBMIT: "/submit",
  DONATE: "/donate",
  FEEDBACK: "/feedback",
  LOGIN: "/login",
  SIGNUP: "/signup",
} as const;

/**
 * Admin routes requiring authentication and admin role
 */
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin/dashboard",
  GAMES: "/admin/games",
  PLAYERS: "/admin/players",
  VIDEOS: "/admin/videos",
} as const;

/**
 * API routes
 */
export const API_ROUTES = {
  TRPC: "/api/trpc",
} as const;

/**
 * External links
 */
export const EXTERNAL_LINKS = {
  YOUTUBE_VIDEO: (id: string) => `https://www.youtube.com/watch?v=${id}`,
  YOUTUBE_CHANNEL: (name: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`,
  INSTAGRAM: (handle: string) => `https://instagram.com/${handle}`,
} as const;
