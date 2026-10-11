"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * A small per-browser preference, like the last Schedule view. Storage can be
 * missing or blocked (private windows, previews), so every access is guarded
 * and the fallback is used instead.
 */

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** A remembered string value, or null before the browser has loaded it or when none is saved. */
export function useLocalPreference(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Not saved; the choice still applies until the page is closed.
      }
      for (const listener of listeners) listener();
    },
    [key],
  );
  return [value, setValue];
}
