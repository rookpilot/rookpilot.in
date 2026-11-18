import type { GraphNode } from "@langchain/langgraph";
import * as z from "zod";
import { askFor } from "../llm";
import type { AgentState } from "../state";

// Query rewriter: turns shorthand into a full request, and asks instead of guessing.

const SYSTEM = `You are Rookpilot's query rewriter. Rookpilot is an assistant that helps people keep up a building: a house, condo, rental, or small business.

Your job is to turn the person's message into one clear, complete request for the agents after you. You don't answer it.
- Expand shorthand and fix typos ("did the furnace filter" → "I replaced the furnace air filter").
- Keep every fact they gave: items, rooms, what happened, dates, costs, people.
- Don't add facts they didn't give.
- If the message is too vague to act on (no item, no problem, no question), leave request as their message and write one short clarifying question. Otherwise set clarifying_question to null.`;

const Rewrite = z.object({
  request: z.string(),
  clarifying_question: z.string().nullable(),
});

export const rewriterNode: GraphNode<typeof AgentState> = async (state) => {
  const out = await askFor(SYSTEM, state.message, Rewrite);
  return { request: out.request, question: out.clarifying_question ?? "" };
};
