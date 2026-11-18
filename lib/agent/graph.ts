import { END, START, StateGraph } from "@langchain/langgraph";
import { generalNode } from "./nodes/general";
import { plannerNode } from "./nodes/planner";
import { projectsNode } from "./nodes/projects";
import { repairsNode } from "./nodes/repairs";
import { rewriterNode } from "./nodes/rewriter";
import { synthesizerNode } from "./nodes/synthesizer";
import { upkeepNode } from "./nodes/upkeep";
import { AGENTS, AgentState } from "./state";

// The Rookpilot chat agent, from the doc's "Agentic workflow":
//
//   message → rewriter → planner → worker(s) → synthesizer → reply
//                └── too vague? ──────────────────┘ (asks a question instead)
//
// Every node is one Claude call with its own system prompt (see nodes/). App actions (buttons)
// and the scheduler don't go through this graph.

export function buildAgentGraph() {
  return (
    new StateGraph(AgentState)
      // 1. Nodes: each step of the workflow.
      .addNode("rewriter", rewriterNode)
      .addNode("planner", plannerNode)
      .addNode("upkeep", upkeepNode)
      .addNode("repairs", repairsNode)
      .addNode("projects", projectsNode)
      .addNode("general", generalNode)
      .addNode("synthesizer", synthesizerNode)

      // 2. Edges: what runs next.
      .addEdge(START, "rewriter")

      // A conditional edge picks the next node while the graph runs. The list names every place
      // it can go, so LangGraph can check the wiring and draw the diagram.
      .addConditionalEdges("rewriter", (state) => (state.question ? "synthesizer" : "planner"), [
        "planner",
        "synthesizer",
      ])

      // The planner's output is the route: returning several node names runs them at the same time.
      .addConditionalEdges("planner", (state) => state.agents, [...AGENTS])

      .addEdge("upkeep", "synthesizer")
      .addEdge("repairs", "synthesizer")
      .addEdge("projects", "synthesizer")
      .addEdge("general", "synthesizer")
      .addEdge("synthesizer", END)

      // 3. Compile: checks the wiring (no missing nodes, nothing unreachable) and makes it runnable.
      .compile()
  );
}

export const agentGraph = buildAgentGraph();
