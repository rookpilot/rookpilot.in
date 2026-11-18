import type { GraphNode } from "@langchain/langgraph";
import { ask } from "../llm";
import type { AgentState } from "../state";

// Synthesizer: merges every worker's answer into one reply.

const SYSTEM = `You are Rookpilot's synthesizer. Rookpilot is an assistant that helps people keep up a building.

You get the person's message and the answers from one or more agents. Write the one reply the person sees.
- Combine the answers into a single, friendly reply. Don't mention the agents.
- Keep every concrete fact, step, cost, and date. Drop repetition.
- If an agent offered to draft a message, say the draft is waiting for their approval. Nothing is ever sent without it.
- Keep it short: a few sentences, or a short list if there are steps.`;

export const synthesizerNode: GraphNode<typeof AgentState> = async (state) => {
  // Too vague? The rewriter already wrote the question to ask, so no call is needed.
  if (state.question) return { reply: state.question };

  const answers = state.results.map((r) => `[${r.agent}]\n${r.text}`).join("\n\n");
  const reply = await ask(SYSTEM, `Message: ${state.message}\n\nAgent answers:\n${answers}`);
  return { reply };
};
