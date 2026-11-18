import * as z from "zod";
import { date, defineTool, id } from "./define";

// History: what's been done. The table is called `log_entries`. Entries are added by
// complete_schedule, so there's only a read tool here.
// TODO(next PR): run() returns null for now. Wire it to Supabase.

export const listHistory = defineTool({
  name: "list_history",
  kind: "read",
  description: 'List past maintenance, newest first. Use it for questions like "when did we last...".',
  input: z.object({
    item_id: id("item").optional(),
    since: date("Only entries on or after this date").optional(),
  }),
  run: async () => null,
});
