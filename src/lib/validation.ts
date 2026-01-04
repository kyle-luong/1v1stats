// src/lib/validation.ts
// Form validation utilities for the submit page

export interface GameStatsInput {
  player1Name: string;
  player2Name: string;
  player1Score: string;
  player2Score: string;
}

export interface GameStatsValidationResult {
  isValid: boolean;
  error?: string;
  hasGameStats: boolean;
}

/**
 * Validates optional game stats fields.
 * Enforces all-or-nothing rule: either all fields must be filled or none.
 * Validates that scores are positive integers within reasonable bounds.
 */
export function validateGameStats(input: GameStatsInput): GameStatsValidationResult {
  const { player1Name, player2Name, player1Score, player2Score } = input;

  const hasAnyGameStat = Boolean(
    player1Name.trim() || player2Name.trim() || player1Score.trim() || player2Score.trim()
  );
  const hasAllGameStats = Boolean(
    player1Name.trim() && player2Name.trim() && player1Score.trim() && player2Score.trim()
  );

  // If no game stats provided, that's valid
  if (!hasAnyGameStat) {
    return { isValid: true, hasGameStats: false };
  }

  // Partial game stats is invalid
  if (!hasAllGameStats) {
    return {
      isValid: false,
      error: "Please fill in all game stats fields or leave them all empty",
      hasGameStats: false,
    };
  }

  // Parse and validate scores
  const p1Score = parseInt(player1Score, 10);
  const p2Score = parseInt(player2Score, 10);

  if (Number.isNaN(p1Score) || Number.isNaN(p2Score)) {
    return {
      isValid: false,
      error: "Scores must be valid numbers",
      hasGameStats: true,
    };
  }

  if (p1Score < 0 || p2Score < 0) {
    return {
      isValid: false,
      error: "Scores must be positive numbers",
      hasGameStats: true,
    };
  }

  if (p1Score > 999 || p2Score > 999) {
    return {
      isValid: false,
      error: "Scores seem unrealistic. Please verify the values",
      hasGameStats: true,
    };
  }

  return { isValid: true, hasGameStats: true };
}

/**
 * Formats game stats into a structured string for the note field.
 */
export function formatGameStatsForNote(input: GameStatsInput, existingNote: string): string {
  const gameInfo = `[GAME DATA] ${input.player1Name.trim()}: ${input.player1Score} vs ${input.player2Name.trim()}: ${input.player2Score}`;
  return existingNote ? `${gameInfo}\n\n${existingNote}` : gameInfo;
}
