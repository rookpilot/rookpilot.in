import type { GraphNode } from "@langchain/langgraph";
import * as z from "zod";
import { askFor } from "../llm";
import { AGENTS, type AgentState } from "../state";

// Planner: decides which worker node(s) the request goes to. graph.ts reads `agents` to route.

const SYSTEM = `You are Rookpilot's planner. Rookpilot is an assistant that helps people keep up a building.

Pick which agents should handle the request. You don't answer it yourself.
- upkeep: routine maintenance the person did or wants to track (changed a filter, swapped a battery, cleaned gutters) and reminders.
- repairs: something broke or isn't working right (a leak, a noise, a crack).
- projects: something new or an improvement (a fire pit, a deck, repainting).
- general: questions about the building and anything that doesn't fit the others.

Pick as few as needed, usually one. Pick more than one only when the request clearly has separate parts, like "I changed the filter and the garage door is grinding". Give a one-sentence reason.`;

const Plan = z.object({
  agents: z.array(z.enum(AGENTS)),
  reason: z.string(),
});

export const plannerNode: GraphNode<typeof AgentState> = async (state) => {
  const plan = await askFor(SYSTEM, state.request, Plan);
  const agents = [...new Set(plan.agents)];
  return { agents: agents.length > 0 ? agents : ["general"], reason: plan.reason };
};
