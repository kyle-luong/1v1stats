// src/types/video.ts
// Video-related TypeScript types

import type { Video, VideoStatus, Game, Player } from "@prisma/client";

/**
 * Video with related game and players
 */
export interface VideoWithGame extends Video {
  game: (Game & {
    player1: Player;
    player2: Player;
  }) | null;
}

/**
 * Video submission input from public form
 */
export interface VideoSubmitInput {
  url: string;
  youtubeId: string;
  title: string;
  channelName: string;
  thumbnailUrl?: string;
  submitterEmail?: string;
  submitterNote?: string;
}

/**
 * Video filter options
 */
export interface VideoFilterOptions {
  channel?: string;
  status?: VideoStatus;
  limit?: number;
}

/**
 * Video card display data
 */
export interface VideoCardData {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
  status: VideoStatus;
  createdAt: Date;
}
