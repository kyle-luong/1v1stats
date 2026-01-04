// src/hooks/useLocalStorage.ts
// LocalStorage hook with SSR safety

import { useState, useCallback, useSyncExternalStore } from "react";

/**
 * Gets the stored value from localStorage
 */
function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Persists state to localStorage with SSR safety.
 * Falls back to default value during SSR and hydration.
 *
 * @param key - localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage("theme", "light");
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Use state to trigger re-renders
  const [storedValue, setStoredValue] = useState<T>(() =>
    getStoredValue(key, defaultValue)
  );

  // Subscribe to storage events for cross-tab sync
  useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => getStoredValue(key, defaultValue),
    () => defaultValue
  );

  // Setter that updates both state and localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}
