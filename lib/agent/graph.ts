import { END, MemorySaver, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { createCheckpointer } from "./checkpointer";
import { agentNode } from "./nodes/agent";
import { humanReviewNode } from "./nodes/humanReview";
import { toolsNode } from "./nodes/tools";
import { AgentState, pendingToolCalls } from "./state";
import { findTool } from "./tools";

export function routeAfterAgent(state: typeof AgentState.State) {
  const calls = pendingToolCalls(state.messages);
  if (calls.length === 0) return END;
  const changesSomething = calls.some((call) => {
    const kind = findTool(call.name)?.kind;
    return kind === "write" || kind === "delete";
  });
  return changesSomething ? "human_review" : "tools";
}

// Tests pass nothing and get a fresh in-memory saver. The app saves to the database (checkpointer.ts).
export function buildAgentGraph(checkpointer: BaseCheckpointSaver = new MemorySaver()) {
  return new StateGraph(AgentState)
    .addNode("agent", agentNode)
    .addNode("human_review", humanReviewNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", routeAfterAgent, ["human_review", "tools", END])
    .addEdge("human_review", "tools")
    .addEdge("tools", "agent")
    .compile({ checkpointer });
}

export const agentGraph = buildAgentGraph(createCheckpointer());
