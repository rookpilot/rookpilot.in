import { ReducedValue, StateSchema } from "@langchain/langgraph";
import * as z from "zod";

// The state is the one object every node reads from and writes to.
// A node never mutates it: it returns only the fields it changed, and LangGraph merges them in.

/** The worker agents. Each one is a node with its own system prompt. */
export const AGENTS = ["upkeep", "repairs", "projects", "general"] as const;
export type AgentName = (typeof AGENTS)[number];

const Result = z.object({ agent: z.enum(AGENTS), text: z.string() });
export type Result = z.infer<typeof Result>;

export const AgentState = new StateSchema({
  /** What the person typed, exactly as they typed it. */
  message: z.string(),

  /** The rewriter's full version of the message. */
  request: z.string().default(""),

  /** Set by the rewriter when the message is too vague. The graph skips to the reply and asks this. */
  question: z.string().default(""),

  /** The workers the planner picked. They all run at the same time. */
  agents: z.array(z.enum(AGENTS)).default(() => []),

  /** The planner's one-line reason, handy for seeing why it routed where it did. */
  reason: z.string().default(""),

  /**
   * What each worker said. A reducer decides how updates combine: here they're appended,
   * so workers running at the same time don't overwrite each other.
   */
  results: new ReducedValue(z.array(Result).default(() => []), {
    reducer: (current, update) => current.concat(update),
  }),

  /** The final reply shown in chat. */
  reply: z.string().default(""),
});
