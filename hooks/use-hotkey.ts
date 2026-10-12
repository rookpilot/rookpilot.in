"use client";

import { useEffect, useEffectEvent } from "react";

/** Runs `handler` on ⌘+key (Mac) or Ctrl+key (elsewhere), e.g. useHotkey("k", openSearch). */
export function useHotkey(key: string, handler: () => void) {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === key) {
      event.preventDefault();
      handler();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
