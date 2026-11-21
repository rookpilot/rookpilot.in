import { dataReducer } from "@/lib/data/reducer";
import { loadAppData, persist } from "@/lib/data/remote";
import { today, type AgentContext } from "../context";
import type { ToolContext } from "./define";

/**
 * Loads everything the person can see, once per round of tool calls. Changes are saved with
 * the app's own save code (persist), then applied to `data` so the next tool call sees them.
 */
export async function loadToolContext(context: Partial<AgentContext> | undefined): Promise<ToolContext> {
  const { buildingId, supabase } = context ?? {};
  if (!buildingId || !supabase) throw new Error("Run the agent with { context: { buildingId, supabase } }.");

  const date = today(context);
  const data = { ...(await loadAppData(supabase, date)), currentBuildingId: buildingId };
  const building = data.buildings.find((b) => b.id === buildingId);
  if (!building) throw new Error(`Building ${buildingId} wasn't found, or this person can't see it.`);

  const tools: ToolContext = {
    building,
    today: date,
    data,
    async save(action) {
      await persist(supabase, action, tools.data);
      tools.data = dataReducer(tools.data, action);
    },
  };
  return tools;
}
