// src/types/game.ts
// Game-related TypeScript types

import type { Game, Player, Video, Stat, Ruleset, CourtType } from "@prisma/client";

/**
 * Game with all related entities loaded
 */
export interface GameWithDetails extends Game {
  video: Video | null;
  player1: Player;
  player2: Player;
  stats: Stat[];
  ruleset: Ruleset | null;
}

/**
 * Game for list display (minimal relations)
 */
export interface GameListItem extends Game {
  video: Video | null;
  player1: Player;
  player2: Player;
}

/**
 * Stats input for game creation
 */
export interface StatInput {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

/**
 * Game creation input
 */
export interface GameCreateInput {
  videoId: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  player1Stats: StatInput;
  player2Stats: StatInput;
  rulesetId?: string;
  isOfficial?: boolean;
  courtType?: CourtType;
  gameDate?: Date;
  location?: string;
  notes?: string;
}
