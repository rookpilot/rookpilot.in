import { interrupt, type GraphNode } from "@langchain/langgraph";
import { needsConfirmation, type ToolKind } from "../confirm";
import { pendingToolCalls, type AgentState, type Decision } from "../state";
import { findTool } from "../tools";

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
};

export type Decisions = Record<string, Decision>;

export const humanReviewNode: GraphNode<typeof AgentState> = (state) => {
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
  const answers = interrupt<PendingChange[], Decisions>(changes);
  return { decisions: { ...confirmed, ...answers } };
};
