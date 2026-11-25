"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type { ChatSummary } from "../chat-groups";

/** How many recent chats the list shows. */
const LIMIT = 100;

/**
 * The person's past chats in this building, newest first. Null while loading. Each person only
 * ever gets their own chats back (the database's rules on `chats`).
 */
export function useChatList(buildingId: string | null) {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  // Switching buildings shows the loading state, not the last building's chats.
  const [lastBuilding, setLastBuilding] = useState(buildingId);
  if (buildingId !== lastBuilding) {
    setLastBuilding(buildingId);
    setChats(null);
  }

  const fetchChats = useCallback(async (): Promise<ChatSummary[]> => {
    if (!buildingId) return [];
    const { data, error } = await createClient()
      .from("chats")
      .select("id, title, updated_at")
      .eq("building_id", buildingId)
      .order("updated_at", { ascending: false })
      .limit(LIMIT);
    if (error) {
      console.error("Loading past chats failed", error);
      return [];
    }
    return data.map((row) => ({ id: row.id, title: row.title, updatedAt: row.updated_at }));
  }, [buildingId]);

  useEffect(() => {
    let cancelled = false;
    void fetchChats().then((next) => {
      if (!cancelled) setChats(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchChats]);

  /** Loads the list again, after a message adds a chat or moves it to the top. */
  const reload = useCallback(async () => setChats(await fetchChats()), [fetchChats]);

  return { chats, reload };
}
