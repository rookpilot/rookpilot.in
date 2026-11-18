import type { GraphNode } from "@langchain/langgraph";
import type { AgentState } from "../state";

// 🛠️ Our node to build together.
//
// Repairs: something broke or isn't working right ("the garage door is making a grinding noise").
// Look at nodes/upkeep.ts: this node has the same shape.
//
// Try it before and after:
//   npm run agent:graph -- "The garage door is making a grinding noise"

// TODO 1: Write the system prompt. Say:
//   - who it is ("You are Rookpilot's Repairs agent…") and what Rookpilot is
//   - what it handles and controls (the building's repair list)
//   - what it can do: ask about the symptom, name likely causes, a DIY fix vs. hiring a pro,
//     offer to draft a message to a pro (only sent when the person approves it in the app)
//   - what it can't do (no building records yet), and how long to answer
// const SYSTEM = `...`;

export const repairsNode: GraphNode<typeof AgentState> = async (state) => {
  // TODO 2: Send the request to Claude with your prompt.
  //   import { ask } from "../llm" and call ask(SYSTEM, state.request).

  // TODO 3: Return the reply as this node's result: { results: [{ agent: "repairs", text }] }.
  return { results: [{ agent: "repairs", text: `(Repairs isn't built yet. It got: "${state.request}")` }] };
};
