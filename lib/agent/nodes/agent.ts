import type { GraphNode } from "@langchain/langgraph";
import type { AgentContext } from "../context";
import { callClaude } from "../llm";
import type { AgentState } from "../state";
import { TOOL_DEFINITIONS } from "../tools";

// The agent: the graph's only Claude call. It sees the whole conversation and every tool,
// and either replies or asks to use tools. After tools run, the graph comes back here.

const SYSTEM = `You are Rookpilot, an assistant that helps people take care of their home or building: upkeep, repairs, and projects.

Your tools read and change the building's records: projects and repairs, maintenance schedules, contacts, rooms, items, and history. Look things up instead of guessing, and use as many tools as the request needs.

Before you change anything:
- Never make up a required field. If the person didn't give one and a list tool can't find it, ask for it. Ask for everything that's missing in one message.
- Optional fields you can fill in from context. Dates are relative to today unless the person says otherwise.
- To change or delete a record you need its id, so find it with a list tool first.

Every tool that changes a record has a guessed field. Set it to true if you filled in anything the person didn't say and you couldn't look up, like picking a room, a date, or a name for them. The app uses it, with the person's settings, to decide whether to show a confirm card first, where they can confirm the change, edit its fields, or cancel it. You don't need to ask for permission yourself.

If the person cancels a change, don't try it again unless they ask. Reply in 1 to 3 short sentences.`;

const DECLINED = "Sorry, I can't help with that one.";

export const agentNode: GraphNode<typeof AgentState, Partial<AgentContext>> = async (state, config) => {
  // The prompt never changes, so it caches well and saved chats keep working. Each message the
  // person sends carries today's date instead (personMessage in state.ts).
  const response = await callClaude({ system: SYSTEM, messages: state.messages, tools: TOOL_DEFINITIONS });
  // Keep every content block (text, thinking, tool calls): later calls send them back as is.
  const content = response.stop_reason === "refusal" ? DECLINED : response.content;
  return { messages: [{ role: "assistant", content }] };
};
