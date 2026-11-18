import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests never call Claude: ask() and askFor() are replaced with fakes, so these check the wiring.
vi.mock("./llm", () => ({ ask: vi.fn(), askFor: vi.fn() }));

import { agentGraph } from "./graph";
import { ask, askFor } from "./llm";

/** Fakes the rewriter and planner (the two askFor calls, in order), and echoes which prompt each ask() got. */
function fakeClaude({ question = null, agents = [] }: { question?: string | null; agents?: string[] }) {
  vi.mocked(askFor)
    .mockResolvedValueOnce({ request: "full request", clarifying_question: question })
    .mockResolvedValueOnce({ agents, reason: "test" });
  vi.mocked(ask).mockImplementation(async (system) => {
    const who = system.match(/^You are Rookpilot's (\w+)/)?.[1] ?? "unknown";
    return `${who} answer`;
  });
}

describe("agent graph", () => {
  beforeEach(() => vi.resetAllMocks());

  it("routes to the agent the planner picks, then synthesizes", async () => {
    fakeClaude({ agents: ["upkeep"] });
    const out = await agentGraph.invoke({ message: "swapped the smoke alarm battery" });
    expect(out.agents).toEqual(["upkeep"]);
    expect(out.results).toEqual([{ agent: "upkeep", text: "Upkeep answer" }]);
    expect(out.reply).toBe("synthesizer answer");
  });

  it("runs every agent the planner picks", async () => {
    fakeClaude({ agents: ["upkeep", "projects"] });
    const out = await agentGraph.invoke({ message: "changed the filter, and I want a fire pit" });
    expect(out.results.map((r) => r.agent).sort()).toEqual(["projects", "upkeep"]);
  });

  it("falls back to General when the planner picks nothing", async () => {
    fakeClaude({ agents: [] });
    const out = await agentGraph.invoke({ message: "hello there friend" });
    expect(out.agents).toEqual(["general"]);
  });

  it("asks a question instead of guessing, without running the workers", async () => {
    fakeClaude({ question: "Which filter do you mean?" });
    const out = await agentGraph.invoke({ message: "filter" });
    expect(out.reply).toBe("Which filter do you mean?");
    expect(askFor).toHaveBeenCalledTimes(1);
    expect(ask).not.toHaveBeenCalled();
  });
});
