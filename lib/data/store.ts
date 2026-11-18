import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { toISODate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";

import { dataReducer, type DataAction } from "./reducer";
import { loadAppData, persist } from "./remote";
import type { AppData } from "./types";

/*
 * The app's data, loaded from Supabase for whoever is signed in.
 * A change shows on screen right away, then is saved in the background, one at a time
 * in the order they were made. If a save fails, the data is reloaded so the screen
 * matches what's actually saved. Components only use the hooks and dispatch() below.
 */

let data: AppData | null = null;
/** Who's signed in, and whose data is loaded. */
let signedIn: string | null = null;
let loadedFor: string | null = null;
/** Bumped on every load so an older, slower load can't overwrite a newer one. */
let loadToken = 0;
/** Saves run one after another. Loads wait for them, so they never miss a change. */
let saves: Promise<void> = Promise.resolve();
let started = false;
const listeners = new Set<() => void>();

const SELECTED_BUILDING_KEY = "rookpilot:building";

function emit() {
  for (const listener of listeners) listener();
}

function rememberBuilding(id: string | null) {
  try {
    if (id) window.localStorage.setItem(SELECTED_BUILDING_KEY, id);
  } catch {
    // Storage can be blocked; the first building is used instead.
  }
}

function rememberedBuilding(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_BUILDING_KEY);
  } catch {
    return null;
  }
}

async function load(userId: string) {
  const token = ++loadToken;
  try {
    let loaded;
    let waitedFor;
    // If a change is saved while this reads, read again so the screen includes it.
    do {
      waitedFor = saves;
      await waitedFor;
      // Created on load in the browser, so "today" is the visitor's date, not the build date.
      loaded = await loadAppData(createClient(), toISODate(new Date()));
      if (token !== loadToken) return;
    } while (saves !== waitedFor);
    const remembered = rememberedBuilding();
    const current = loaded.buildings.some((b) => b.id === remembered) ? remembered : (loaded.buildings[0]?.id ?? null);
    data = { ...loaded, currentBuildingId: current };
    loadedFor = userId;
    emit();
  } catch (error) {
    if (token !== loadToken) return;
    console.error("Loading data failed", error);
    toast.error("Couldn't load your buildings. Check your connection and refresh the page.");
  }
}

/** Loads when someone signs in, and clears everything when they sign out or switch accounts. */
function start() {
  if (started) return;
  started = true;
  createClient().auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    signedIn = userId;
    if (userId === loadedFor && data) return;
    if (userId !== loadedFor) {
      data = null;
      loadedFor = null;
      emit();
    }
    // Leave the auth callback before querying, as Supabase recommends.
    if (userId) setTimeout(() => void load(userId), 0);
    else loadToken++;
  });
}

function getSnapshot(): AppData | null {
  start();
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

function emptyData(): AppData {
  return { buildings: [], spaces: [], items: [], schedules: [], logs: [], work: [], contacts: [], attachments: [], currentBuildingId: null, today: toISODate(new Date()) };
}

export function dispatch(action: DataAction) {
  start();
  // Onboarding can finish before anything is loaded. The save still happens, and the load waits for it.
  const before = data ?? emptyData();
  if (data) {
    data = dataReducer(data, action);
    emit();
  }
  if (data?.currentBuildingId !== before.currentBuildingId) rememberBuilding(data?.currentBuildingId ?? null);
  if (action.type === "selectBuilding") return;

  const supabase = createClient();
  saves = saves
    .then(() => persist(supabase, action, before))
    .catch((error) => {
      console.error(`Saving "${action.type}" failed`, error);
      toast.error("Couldn't save that change. Showing what's saved.");
      if (signedIn) void load(signedIn);
    });
  // Nothing was on screen to update, so load once this save is done.
  if (!data && signedIn) void load(signedIn);
}

/** All app data, or null while loading. */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const newId = () => crypto.randomUUID();
