"use client";

import { useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/** Placeholder reply until the AI assistant is connected (phase 3). */
export const STUB_REPLY =
  "Rookpilot's assistant isn't connected yet. For now, mark tasks done from Home or the Schedule, and log fixes in Repairs.";

export function useStubChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
      { id: crypto.randomUUID(), role: "assistant", text: STUB_REPLY },
    ]);
  }

  return { messages, send };
}
