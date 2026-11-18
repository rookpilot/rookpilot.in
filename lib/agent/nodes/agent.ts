import type { GraphNode } from "@langchain/langgraph";
import { callClaude } from "../llm";
import type { AgentState } from "../state";

// The agent: the graph's only Claude call. It has no tools yet, so for now it can only talk.

const SYSTEM = `You are Rookpilot, an assistant that helps people take care of their home or building: upkeep, repairs, and projects.

You can't see or change the person's records yet. If they ask you to look something up or change something, say that's coming soon. Answer in 1 to 3 short sentences.`;

const DECLINED = "Sorry, I can't help with that one.";

export const agentNode: GraphNode<typeof AgentState> = async (state) => {
  const response = await callClaude({ system: SYSTEM, messages: state.messages });
  // Keep every content block, not just the text: later turns send them back to Claude as is.
  const content = response.stop_reason === "refusal" ? DECLINED : response.content;
  return { messages: [{ role: "assistant", content }] };
};
