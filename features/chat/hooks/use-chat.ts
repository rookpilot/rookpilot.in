"use client";

import { useRef, useState } from "react";

import type { ChatTurn } from "@/lib/agent/chat";
import type { Decisions, PendingChange } from "@/lib/agent/nodes/humanReview";
import { toISODate } from "@/lib/dates";
import { reloadAppData } from "@/lib/data/store";

import { answerCard, sendMessage } from "../actions";

export type ChatEntry =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; error?: boolean }
  /**
   * The confirm card. `answers` is set once the person has answered it. `attempt` goes up when
   * sending the answers failed and the card opens again.
   */
  | { id: string; role: "card"; changes: PendingChange[]; answers?: Decisions; attempt?: number };

const newId = () => crypto.randomUUID();

/**
 * The conversation with the agent, through the server actions. One thread per chat: the
 * server keeps the conversation, so a card answer picks up the same run where it paused.
 */
export function useChat(buildingId: string | null) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  // Made on the first message, not on render: the page is prerendered, where random values aren't allowed.
  const threadRef = useRef<string | null>(null);
  const threadId = () => (threadRef.current ??= newId());
  const [thinking, setThinking] = useState(false);
  // Guards against a double click sending twice before `thinking` re-renders.
  const busy = useRef(false);

  const add = (entry: ChatEntry) => setEntries((current) => [...current, entry]);
  const waitingCard = entries.some((entry) => entry.role === "card" && !entry.answers);

  /** Runs one call and shows what came back. Returns false if it failed. */
  async function run(call: () => Promise<ChatTurn>): Promise<boolean> {
    busy.current = true;
    setThinking(true);
    try {
      const turn = await call();
      if (turn.kind === "reply") add({ id: newId(), role: "assistant", text: turn.text });
      if (turn.kind === "confirm") add({ id: newId(), role: "card", changes: turn.changes });
      if (turn.kind === "error") add({ id: newId(), role: "assistant", text: turn.message, error: true });
      // The agent saves on the server, so show its changes on the other tabs too.
      if (turn.kind !== "error") reloadAppData();
      return turn.kind !== "error";
    } catch {
      add({ id: newId(), role: "assistant", text: "Couldn't reach Rookpilot. Check your connection and try again.", error: true });
      return false;
    } finally {
      busy.current = false;
      setThinking(false);
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy.current || waitingCard) return;
    add({ id: newId(), role: "user", text: trimmed });
    if (!buildingId) {
      add({ id: newId(), role: "assistant", text: "Add a building first, then I can help with it.", error: true });
      return;
    }
    void run(() => sendMessage({ threadId: threadId(), buildingId, text: trimmed, today: toISODate(new Date()) }));
  }

  async function answer(cardId: string, answers: Decisions) {
    if (busy.current || !buildingId) return;
    const update = (patch: (card: Extract<ChatEntry, { role: "card" }>) => Partial<ChatEntry>) =>
      setEntries((current) => current.map((entry) => (entry.id === cardId && entry.role === "card" ? ({ ...entry, ...patch(entry) } as ChatEntry) : entry)));
    update(() => ({ answers }));
    const ok = await run(() => answerCard({ threadId: threadId(), buildingId, decisions: answers, today: toISODate(new Date()) }));
    // The run is still paused on the card, so open it again to answer.
    if (!ok) update((card) => ({ answers: undefined, attempt: (card.attempt ?? 0) + 1 }));
  }

  /** Starts over with a new thread. */
  function reset() {
    if (busy.current) return;
    setEntries([]);
    threadRef.current = null;
  }

  return { entries, thinking, waitingCard, send, answer, reset };
}
