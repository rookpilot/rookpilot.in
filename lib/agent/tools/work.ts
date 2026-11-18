import * as z from "zod";
import { date, defineTool, id } from "./define";

// Projects and repairs. They share the `work` table, told apart by `kind`.
// TODO(next PR): every run() returns null for now. Wire them to Supabase.

const kind = z
  .enum(["project", "repair"])
  .describe("project: adding or improving something. repair: fixing something that broke.");

const status = z
  .enum(["idea", "planning", "open", "in_progress", "done", "fixed"])
  .describe("Projects use idea, planning, in_progress, done. Repairs use open, in_progress, fixed.");

const optionalFields = {
  room_id: id("room").optional(),
  item_id: id("item").optional(),
  performed_by: z.enum(["diy", "hired"]).optional().describe("Who does the work. Defaults to diy."),
  budget: z.number().nonnegative().optional().describe("Projects only. In dollars."),
  planned_on: date("Target date for a project, or scheduled date for a repair").optional(),
  notes: z.string().optional(),
};

export const listWork = defineTool({
  name: "list_work",
  kind: "read",
  description: "List the building's projects and repairs. Filter by kind, status, or room.",
  input: z.object({
    kind: kind.optional(),
    status: status.optional(),
    room_id: id("room").optional(),
  }),
  run: async () => null,
});

export const createWork = defineTool({
  name: "create_work",
  kind: "write",
  description: "Add a project or a repair.",
  input: z.object({
    kind,
    title: z.string().min(1).describe('Short name, like "Fire pit" or "Cracked bathroom tile".'),
    status: status.optional().describe("Defaults to idea for a project, open for a repair."),
    ...optionalFields,
  }),
  run: async () => null,
});

export const updateWork = defineTool({
  name: "update_work",
  kind: "write",
  description: "Change a project or repair: rename it, move its status along, set its cost, and so on.",
  input: z.object({
    id: id("project or repair"),
    title: z.string().min(1).optional(),
    status: status.optional(),
    cost: z.number().nonnegative().optional().describe("What it actually cost, in dollars."),
    finished_on: date("When it was finished").optional(),
    ...optionalFields,
  }),
  run: async () => null,
});

export const deleteWork = defineTool({
  name: "delete_work",
  kind: "delete",
  description: "Delete a project or repair for good.",
  input: z.object({ id: id("project or repair") }),
  run: async () => null,
});
