import * as z from "zod";
import { date, defineTool, id } from "./define";

// Maintenance schedules: the repeating reminders on each item (the Schedule tab and calendar).
// TODO(next PR): every run() returns null for now. Wire them to Supabase.

const repeat = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("interval"),
      count: z.int().positive(),
      unit: z.enum(["day", "week", "month", "year"]),
    }),
    z.object({
      kind: z.literal("seasonal"),
      seasons: z.array(z.enum(["spring", "summer", "fall", "winter"])).min(1),
    }),
  ])
  .describe('How often it repeats: every N days/weeks/months/years, or in certain seasons. Example: {"kind": "interval", "count": 3, "unit": "month"}.');

export const listSchedules = defineTool({
  name: "list_schedules",
  kind: "read",
  description: "List maintenance schedules with their next due dates. Use due_before for questions like \"what's due this week?\".",
  input: z.object({
    due_before: date("Only schedules due on or before this date").optional(),
    item_id: id("item").optional(),
  }),
  run: async () => null,
});

export const createSchedule = defineTool({
  name: "create_schedule",
  kind: "write",
  description: "Add a repeating maintenance reminder to an item.",
  input: z.object({
    item_id: id("item"),
    title: z.string().min(1).describe('What to do, like "Replace filter".'),
    repeat,
    next_due_on: date("When it's first due"),
  }),
  run: async () => null,
});

export const updateSchedule = defineTool({
  name: "update_schedule",
  kind: "write",
  description: "Change a schedule. To snooze it, set a later next_due_on. To pause it, set active to false.",
  input: z.object({
    id: id("schedule"),
    title: z.string().min(1).optional(),
    repeat: repeat.optional(),
    next_due_on: date("New due date").optional(),
    active: z.boolean().optional(),
  }),
  run: async () => null,
});

export const completeSchedule = defineTool({
  name: "complete_schedule",
  kind: "write",
  description: "Mark a scheduled task done. Adds it to the history and moves the next due date forward.",
  input: z.object({
    id: id("schedule"),
    done_on: date("When it was done"),
    note: z.string().optional(),
    cost: z.number().nonnegative().optional().describe("In dollars."),
    contact_ids: z.array(z.string()).optional().describe("Contacts who did the work."),
  }),
  run: async () => null,
});

export const deleteSchedule = defineTool({
  name: "delete_schedule",
  kind: "delete",
  description: "Delete a schedule for good. Its past history stays.",
  input: z.object({ id: id("schedule") }),
  run: async () => null,
});
