import * as z from "zod";
import { selectHistory } from "@/lib/data/selectors";
import { date, defineTool, id } from "./define";
import { logOut, workOut } from "./records";

// History: what's been done. Finished maintenance (the `log_entries` table, added by
// complete_schedule) plus finished projects and repairs, so there's only a read tool here.

export const listHistory = defineTool({
  name: "list_history",
  kind: "read",
  description: 'List what\'s been done: finished maintenance, projects, and repairs, newest first. Use it for questions like "when did we last...".',
  input: z.object({
    item_id: id("item").optional(),
    since: date("Only entries on or after this date").optional(),
  }),
  run: async (input, ctx) =>
    selectHistory(ctx.data, ctx.building.id)
      .filter((entry) => !input.since || entry.date >= input.since)
      .filter((entry) => !input.item_id || entry.item?.id === input.item_id)
      .map((entry) => (entry.kind === "task" ? logOut(ctx, entry.log) : workOut(ctx, entry.work))),
});
