import { interrupt, type GraphNode } from "@langchain/langgraph";
import { needsConfirmation, type ToolKind } from "../confirm";
import type { AgentContext } from "../context";
import { pendingToolCalls, type AgentState, type Decision } from "../state";
import { findTool } from "../tools";
import { loadToolContext } from "../tools/context";

// human_review: the confirm card. Shows the person the change Claude wants to make, with its
// fields, so they can confirm it, edit the fields, or cancel it. Not a Claude call.
//
// Every write and delete comes through here. Deletes always get a card. Writes get one when
// Claude set ask_first, which it decides from the person's confirm level. Changes that don't
// need a card are confirmed right away, and if none need one, the graph doesn't pause.
//
// interrupt() is LangGraph's human-in-the-loop pause: it saves the graph's state and stops.
// The app resumes it with new Command({ resume: { [toolCallId]: decision } }). On resume this
// node runs again from the top, and interrupt() returns those decisions.

/** One change waiting for the person's OK. This is what the confirm card shows. */
export type PendingChange = {
  toolCallId: string;
  tool: string;
  kind: Exclude<ToolKind, "read">;
  input: Record<string, unknown>;
  /** What else goes with it, like the items in a room being deleted. */
  effects?: string;
};

export type Decisions = Record<string, Decision>;

export const humanReviewNode: GraphNode<typeof AgentState, Partial<AgentContext>> = async (state, config) => {
  const confirmed: Decisions = {};
  const changes: PendingChange[] = [];

  for (const call of pendingToolCalls(state.messages)) {
    const kind = findTool(call.name)?.kind;
    if (kind !== "write" && kind !== "delete") continue;
    const { ask_first, ...input } = call.input as Record<string, unknown>;
    if (needsConfirmation(kind, ask_first === true)) {
      changes.push({ toolCallId: call.id, tool: call.name, kind, input });
    } else {
      confirmed[call.id] = { action: "confirm" };
    }
  }

  if (changes.length === 0) return { decisions: confirmed };
  await addEffects(changes, config.context);
  const answers = interrupt<PendingChange[], Decisions>(changes);
  return { decisions: { ...confirmed, ...answers } };
};

/** Fills in what else each delete takes with it, so the card can say so. */
async function addEffects(changes: PendingChange[], context: Partial<AgentContext> | undefined) {
  const withEffects = changes.filter((change) => findTool(change.tool)?.effects);
  if (withEffects.length === 0) return;
  const toolContext = await loadToolContext(context);
  for (const change of withEffects) {
    const tool = findTool(change.tool)!;
    try {
      const effects = tool.effects!(tool.parse(change.input), toolContext);
      if (effects) change.effects = effects;
    } catch {
      // Bad input: the tools node sends the error back to Claude, so the card just shows the change.
    }
  }
}
