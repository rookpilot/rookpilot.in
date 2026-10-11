import { useSyncExternalStore } from "react";

import { toISODate } from "@/lib/dates";

import { dataReducer, type DataAction } from "./reducer";
import { createSampleData } from "./sample-data";
import type { AppData } from "./types";

/*
 * Phase 1 data store: sample data held in memory in the browser.
 * It survives navigation between pages and resets on refresh.
 * In phase 2 this module is replaced by API calls; components only use the hooks below.
 */

let data: AppData | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): AppData {
  // Created on first read in the browser, so "today" is the visitor's date, not the build date.
  data ??= createSampleData(toISODate(new Date()));
  return data;
}

/** Nothing is known while the page is pre-rendered; components show a loading state. */
function getServerSnapshot(): null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dispatch(action: DataAction) {
  data = dataReducer(getSnapshot(), action);
  for (const listener of listeners) listener();
}

/** All app data, or null while loading. */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const newId = () => crypto.randomUUID();
