"use client";

import { useSyncExternalStore } from "react";

/** Whether a CSS media query matches, like "(min-width: 1024px)". False until the browser has loaded. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
