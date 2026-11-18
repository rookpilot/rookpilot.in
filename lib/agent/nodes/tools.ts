import type Anthropic from "@anthropic-ai/sdk";
import type { GraphNode } from "@langchain/langgraph";
import { pendingToolCalls, type AgentState, type Decision, type ToolCall } from "../state";
import { findTool, type ToolContext } from "../tools";

// tools: runs every tool call in Claude's last message, then the graph goes back to the agent.
// Writes and deletes only get here after human_review, so each one has the person's decision.

type ToolResult = Anthropic.Beta.BetaToolResultBlockParam;

export const toolsNode: GraphNode<typeof AgentState, Partial<ToolContext>> = async (state, config) => {
  const buildingId = config.context?.buildingId;
  if (!buildingId) throw new Error("Run the agent with { context: { buildingId } }.");

  const calls = pendingToolCalls(state.messages);
  const results = await Promise.all(calls.map((call) => runOne(call, state.decisions[call.id], { buildingId })));

  // All results go back in one message: the API expects one tool_result for every tool call.
  return { messages: [{ role: "user", content: results }], decisions: {} };
};

async function runOne(call: ToolCall, decision: Decision | undefined, context: ToolContext): Promise<ToolResult> {
  const result = (content: string, is_error = false): ToolResult => ({
    type: "tool_result",
    tool_use_id: call.id,
    content,
    ...(is_error && { is_error }),
  });

  const tool = findTool(call.name);
  if (!tool) return result(`There's no tool called ${call.name}.`, true);

  let input = call.input;
  if (tool.kind !== "read") {
    if (!decision) return result("This change wasn't confirmed, so it didn't run.", true);
    if (decision.action === "cancel") {
      return result(`The person cancelled this change${decision.reason ? `: ${decision.reason}` : "."} Nothing was changed.`);
    }
    if (decision.action === "edit") input = { ...(call.input as object), ...decision.input };
  }

  try {
    const output = await tool.run(tool.parse(input), context);
    return result(JSON.stringify(output ?? null));
  } catch (error) {
    // Bad input or a failed save: tell Claude what went wrong so it can fix the call or explain.
    return result(error instanceof Error ? error.message : String(error), true);
  }
}
