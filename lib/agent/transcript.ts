import type { Message } from "./llm";
import type { PendingChange } from "./nodes/humanReview";
import { CANCELLED } from "./nodes/tools";

// Turns a saved conversation back into what the chat shows, so an old chat looks the way it did:
// the person's messages, the tools Rookpilot used, its replies, and a card still waiting.
//
// Cards that were already answered aren't shown again: the steps after them say what happened.
// Cancelled changes are left out, like they are while chatting.

export type TranscriptStep = { id: string; tool: string; input: Record<string, unknown>; status: "done" | "failed" };

export type TranscriptEntry =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; steps?: TranscriptStep[] }
  | { id: string; role: "card"; changes: PendingChange[]; steps?: TranscriptStep[] };

export function toTranscript(messages: Message[], pending?: PendingChange[]): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  // Tool calls since the last reply, by id, in the order Claude made them.
  let calls = new Map<string, { tool: string; input: Record<string, unknown> }>();
  let steps: TranscriptStep[] = [];
  const takeSteps = () => {
    const taken = steps.length ? { steps } : {};
    steps = [];
    calls = new Map();
    return taken;
  };

  messages.forEach((message, index) => {
    const id = `m${index}`;
    const { content } = message;
    if (typeof content === "string") {
      if (message.role === "user") entries.push({ id, role: "user", text: content });
      else entries.push({ id, role: "assistant", text: content.trim(), ...takeSteps() });
      return;
    }
    if (!content) return;

    if (message.role === "user") {
      // The first text is what the person typed. The text after it is the date added to it.
      const typed = content.find((block) => block.type === "text");
      if (typed?.type === "text") entries.push({ id, role: "user", text: typed.text });
      for (const block of content) {
        if (block.type !== "tool_result") continue;
        const call = calls.get(block.tool_use_id);
        if (!call || resultText(block.content).startsWith(CANCELLED)) continue;
        steps.push({ id: block.tool_use_id, ...call, status: block.is_error ? "failed" : "done" });
      }
      return;
    }

    let hasCalls = false;
    for (const block of content) {
      if (block.type !== "tool_use") continue;
      hasCalls = true;
      const input = { ...(block.input as Record<string, unknown>) };
      delete input.guessed;
      calls.set(block.id, { tool: block.name, input });
    }
    // Text next to tool calls is Claude thinking out loud. The chat only shows the final reply.
    if (hasCalls) return;
    const text = content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("").trim();
    entries.push({ id, role: "assistant", text, ...takeSteps() });
  });

  if (pending?.length) entries.push({ id: "pending", role: "card", changes: pending, ...takeSteps() });
  return entries;
}

function resultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block: { type?: string; text?: string }) => (block.type === "text" ? (block.text ?? "") : "")).join("");
}
