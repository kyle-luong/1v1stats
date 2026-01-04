// src/hooks/useMediaQuery.ts
// Media query hook for responsive behavior

import { useSyncExternalStore } from "react";

/**
 * Tracks whether a CSS media query matches.
 * Useful for responsive behavior that can't be handled with CSS alone.
 *
 * @param query - CSS media query string
 * @returns Whether the media query currently matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false // Server-side fallback
  );
}

/**
 * Common breakpoint queries matching Tailwind defaults
 */
export const BREAKPOINTS = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const;
