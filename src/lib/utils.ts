/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * Prevents style conflicts and allows conditional class application
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Calculates field goal percentage
 */
export function calculateFGPercentage(made: number, attempted: number): string {
  if (attempted === 0) return "0.0";
  return ((made / attempted) * 100).toFixed(1);
}

/**
 * Calculates points per game
 */
export function calculatePPG(totalPoints: number, gamesPlayed: number): string {
  if (gamesPlayed === 0) return "0.0";
  return (totalPoints / gamesPlayed).toFixed(1);
}

/**
 * Calculates win/loss record for a player
 * Phase 3 will compute from events
 */
export function calculateWinLoss(
  games: Array<{ winnerId: string; player1Id: string; player2Id: string }>,
  playerId: string
): { wins: number; losses: number } {
  const wins = games.filter((game) => game.winnerId === playerId).length;
  const losses = games.filter(
    (game) =>
      (game.player1Id === playerId || game.player2Id === playerId) &&
      game.winnerId !== playerId
  ).length;
  return { wins, losses };
}

/**
 * Calculates total points scored by a player across all games
 * Phase 3 will compute from events
 */
export function calculateTotalPoints(
  games: Array<{
    player1Id: string;
    player2Id: string;
    player1Score: number;
    player2Score: number;
  }>,
  playerId: string
): number {
  return games.reduce((total, game) => {
    if (game.player1Id === playerId) return total + game.player1Score;
    if (game.player2Id === playerId) return total + game.player2Score;
    return total;
  }, 0);
}

/**
 * Calculates age from birth date
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
