import { END, START, StateGraph } from "@langchain/langgraph";
import { agentNode } from "./nodes/agent";
import { AgentState } from "./state";

// The Rookpilot chat agent. For now it's one node:
//
//   START → agent → END
//
// Next, the agent gets tools and loops through them (agent ⇄ tools) until it has an answer.

export function buildAgentGraph() {
  return (
    new StateGraph(AgentState)
      .addNode("agent", agentNode)
      .addEdge(START, "agent")
      .addEdge("agent", END)
      // Compile checks the wiring (no missing or unreachable nodes) and makes it runnable.
      .compile()
  );
}

export const agentGraph = buildAgentGraph();
