"use client";

import { useRef, useState } from "react";

import type { ChatRequest, ChatTurn } from "@/lib/agent/chat";
import type { Decisions, PendingChange } from "@/lib/agent/nodes/humanReview";
import { toISODate } from "@/lib/dates";
import { reloadAppData } from "@/lib/data/store";

import type { Step } from "../steps";
import { readEvents } from "../stream";

export type ChatEntry =
  | { id: string; role: "user"; text: string }
  /** `steps` are the tools Rookpilot used to get to this reply. */
  | { id: string; role: "assistant"; text: string; error?: boolean; steps?: Step[] }
  /**
   * The confirm card. `answers` is set once the person has answered it. `attempt` goes up when
   * sending the answers failed and the card opens again.
   */
  | { id: string; role: "card"; changes: PendingChange[]; answers?: Decisions; attempt?: number; steps?: Step[] };

const newId = () => crypto.randomUUID();

/**
 * The conversation with the agent, streamed from /api/chat. One thread per chat: the server
 * keeps the conversation, so a card answer picks up the same run where it paused.
 */
export function useChat(buildingId: string | null) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  // Made on the first message, not on render: the page is prerendered, where random values aren't allowed.
  const threadRef = useRef<string | null>(null);
  const threadId = () => (threadRef.current ??= newId());
  const [thinking, setThinking] = useState(false);
  /** The tools Rookpilot is using right now, shown while it works. */
  const [live, setLive] = useState<Step[]>([]);
  // Guards against a double click sending twice before `thinking` re-renders.
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);

  const add = (entry: ChatEntry) => setEntries((current) => [...current, entry]);
  const waitingCard = entries.some((entry) => entry.role === "card" && !entry.answers);

  /** Streams one request and shows what comes back. Returns false if it failed. */
  async function run(body: ChatRequest): Promise<boolean> {
    busy.current = true;
    setThinking(true);
    const controller = new AbortController();
    request.current = controller;
    let steps: Step[] = [];
    const show = (next: Step[]) => {
      steps = next;
      setLive(next);
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Chat request failed: ${response.status}`);

      let turn: ChatTurn | undefined;
      for await (const event of readEvents(response.body)) {
        if (event.type === "step") show([...steps, { id: event.id, tool: event.tool, input: event.input, status: "running" }]);
        if (event.type === "step_done") show(steps.map((s) => (s.id === event.id ? { ...s, status: event.ok ? "done" : "failed" } : s)));
        if (event.type === "turn") turn = event.turn;
      }
      if (!turn) throw new Error("The chat stream ended early");

      // Steps still running are the changes now waiting on the card, so they're left out.
      const finished = steps.filter((s) => s.status !== "running");
      const withSteps = finished.length ? { steps: finished } : {};
      if (turn.kind === "reply") add({ id: newId(), role: "assistant", text: turn.text, ...withSteps });
      if (turn.kind === "confirm") add({ id: newId(), role: "card", changes: turn.changes, ...withSteps });
      if (turn.kind === "error") add({ id: newId(), role: "assistant", text: turn.message, error: true, ...withSteps });
      // The agent saves on the server, so show its changes on the other tabs too.
      if (turn.kind !== "error") reloadAppData();
      return turn.kind !== "error";
    } catch {
      if (controller.signal.aborted) return false;
      add({ id: newId(), role: "assistant", text: "Couldn't reach Rookpilot. Check your connection and try again.", error: true });
      return false;
    } finally {
      if (request.current === controller) {
        request.current = null;
        busy.current = false;
        setThinking(false);
        setLive([]);
      }
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
    void run({ action: "message", input: { threadId: threadId(), buildingId, text: trimmed, today: toISODate(new Date()) } });
  }

  async function answer(cardId: string, answers: Decisions) {
    if (busy.current || !buildingId) return;
    const update = (patch: (card: Extract<ChatEntry, { role: "card" }>) => Partial<ChatEntry>) =>
      setEntries((current) => current.map((entry) => (entry.id === cardId && entry.role === "card" ? ({ ...entry, ...patch(entry) } as ChatEntry) : entry)));
    update(() => ({ answers }));
    const ok = await run({ action: "answer", input: { threadId: threadId(), buildingId, decisions: answers, today: toISODate(new Date()) } });
    // The run is still paused on the card, so open it again to answer.
    if (!ok) update((card) => ({ answers: undefined, attempt: (card.attempt ?? 0) + 1 }));
  }

  /** Starts over with a new thread, dropping anything still on its way. */
  function reset() {
    request.current?.abort();
    request.current = null;
    busy.current = false;
    setThinking(false);
    setLive([]);
    setEntries([]);
    threadRef.current = null;
  }

  return { entries, thinking, live, waitingCard, send, answer, reset };
}
