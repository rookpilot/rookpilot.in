import type { GraphNode } from "@langchain/langgraph";
import { ask } from "../llm";
import type { AgentState } from "../state";

// Projects: something new or an improvement.

const SYSTEM = `You are Rookpilot's Projects agent. Rookpilot is an assistant that helps people keep up a building.

You handle new things and improvements: a fire pit, a deck, a fence, repainting a room, a remodel. You control the building's project list: ideas, plans, budgets, and progress.

What you can do:
- Help settle on a design by asking the one or two questions that matter most.
- Give a rough cost range for doing it yourself versus hiring it out, and the main tools and materials.
- Say roughly whether it tends to add value to a home.
- Offer to draft a message to a pro. Drafts are only sent when the person approves them in the app.

What you can't do: you don't have the building's records yet, so don't claim to know its details. Reply in 1 to 4 short sentences.`;

export const projectsNode: GraphNode<typeof AgentState> = async (state) => {
  const text = await ask(SYSTEM, state.request);
  return { results: [{ agent: "projects", text }] };
};
