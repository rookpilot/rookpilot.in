import { ReducedValue, StateSchema } from "@langchain/langgraph";
import * as z from "zod";
import type { Message } from "./llm";

// The state is the one object every node reads from and writes to.
// A node never mutates it: it returns only what it changed, and LangGraph merges that in.

export const AgentState = new StateSchema({
  /**
   * The whole conversation, in the shape the Claude API takes, so it can be sent as is.
   * The reducer appends: a node returns only its new messages and they're added to the end.
   */
  messages: new ReducedValue(z.array(z.custom<Message>()).default(() => []), {
    reducer: (current, update) => current.concat(update),
  }),
});

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
