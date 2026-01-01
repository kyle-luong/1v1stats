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
