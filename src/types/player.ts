// src/types/player.ts
// Player-related TypeScript types

import type { Player, Game, Stat } from "@prisma/client";

/**
 * Player with computed career statistics
 */
export interface PlayerWithStats extends Player {
  gamesPlayed: number;
  wins: number;
  losses: number;
  gamesAsPlayer1: Game[];
  gamesAsPlayer2: Game[];
  stats: Stat[];
}

/**
 * Player form data for create/update operations
 */
export interface PlayerFormData {
  name: string;
  aliases: string[];
  instagramHandle?: string;
  height?: string;
  position?: string;
  location?: string;
  imageUrl?: string;
}

/**
 * Player card display data (minimal for lists)
 */
export interface PlayerCardData {
  id: string;
  name: string;
  imageUrl: string | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
}
