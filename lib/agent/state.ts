import type Anthropic from "@anthropic-ai/sdk";
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import * as z from "zod";
import type { Message } from "./llm";

// The state is the one object every node reads from and writes to.
// A node never mutates it: it returns only what it changed, and LangGraph merges that in.

/** What the person decided on the confirm card for one change. */
export type Decision =
  | { action: "confirm" }
  /** Runs the change with these fields swapped in for what Claude proposed. */
  | { action: "edit"; input: Record<string, unknown> }
  | { action: "cancel"; reason?: string };

export const AgentState = new StateSchema({
  /**
   * The whole conversation, in the shape the Claude API takes, so it can be sent as is.
   * The reducer appends: a node returns only its new messages and they're added to the end.
   */
  messages: new ReducedValue(z.array(z.custom<Message>()).default(() => []), {
    reducer: (current, update) => current.concat(update),
  }),

  /**
   * Confirm card answers for the changes Claude just proposed, by tool call id.
   * No reducer, so each update replaces it.
   */
  decisions: z.record(z.string(), z.custom<Decision>()).default(() => ({})),
});

export type ToolCall = Anthropic.Beta.BetaToolUseBlockParam;

/** The tool calls in the last message, if Claude just asked to use tools. */
export function pendingToolCalls(messages: Message[]): ToolCall[] {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant" || typeof last.content === "string") return [];
  return last.content.filter((block): block is ToolCall => block.type === "tool_use");
}

/** The text of the last assistant message: what the chat shows as the reply. */
export function lastReply(messages: Message[]): string {
  const last = messages.findLast((message) => message.role === "assistant");
  if (!last) return "";
  if (typeof last.content === "string") return last.content;
  return last.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
}
