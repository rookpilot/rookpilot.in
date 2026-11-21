import * as z from "zod";
import { buildSchedule } from "@/lib/data/builders";
import type { Completion } from "@/lib/data/reducer";
import { afterDone, computeNextDue } from "@/lib/scheduling";
import { date, defineTool, id } from "./define";
import { findContact, findItem, findSchedule, given, inBuilding, newId, scheduleOut } from "./records";

// Maintenance schedules: the repeating reminders on each item (the Schedule tab and calendar).

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
  description: 'List maintenance schedules, soonest due first. Use due_before for questions like "what\'s due this week?".',
  input: z.object({
    due_before: date("Only schedules due on or before this date. Leaves out paused ones").optional(),
    item_id: id("item").optional(),
  }),
  run: async (input, ctx) =>
    inBuilding(ctx)
      .schedules.filter((s) => !input.item_id || s.itemId === input.item_id)
      .filter((s) => !input.due_before || (s.active && s.nextDueOn <= input.due_before))
      .sort((a, b) => a.nextDueOn.localeCompare(b.nextDueOn))
      .map((s) => scheduleOut(ctx, s)),
});

export const createSchedule = defineTool({
  name: "create_schedule",
  kind: "write",
  description: "Add a repeating maintenance reminder to an item.",
  input: z.object({
    item_id: id("item"),
    title: z.string().min(1).describe('What to do, like "Replace filter".'),
    repeat,
    next_due_on: date("When it's first due. Leave it out to count from today, like 3 months from today for every 3 months").optional(),
  }),
  run: async (input, ctx) => {
    const item = findItem(ctx, input.item_id);
    const schedule = buildSchedule(item.id, { title: input.title.trim(), repeat: input.repeat }, ctx.today, ctx.building.hemisphere, newId);
    if (input.next_due_on) schedule.nextDueOn = input.next_due_on;
    await ctx.save({ type: "addSchedule", schedule });
    return scheduleOut(ctx, schedule);
  },
});

export const updateSchedule = defineTool({
  name: "update_schedule",
  kind: "write",
  description: "Change a schedule. To snooze it, set a later next_due_on. To pause it, set active to false.",
  input: z.object({
    id: id("schedule"),
    title: z.string().min(1).optional(),
    repeat: repeat.optional().describe("A new repeat also moves the next due date, unless you set next_due_on."),
    next_due_on: date("New due date").optional(),
    active: z.boolean().optional(),
  }),
  run: async (input, ctx) => {
    const schedule = findSchedule(ctx, input.id);
    // Like the app: a new repeat counts from the last time it was done, or the install date, or today.
    const item = findItem(ctx, schedule.itemId);
    const from = schedule.lastDoneOn ?? item.installedOn ?? ctx.today;
    const nextDueOn = input.next_due_on ?? (input.repeat && computeNextDue(input.repeat, from, ctx.building.hemisphere));
    const patch = given({ title: input.title?.trim(), repeat: input.repeat, nextDueOn, active: input.active });
    await ctx.save({ type: "updateSchedule", id: schedule.id, patch });
    return scheduleOut(ctx, findSchedule(ctx, schedule.id));
  },
});

export const completeSchedule = defineTool({
  name: "complete_schedule",
  kind: "write",
  description: "Mark a scheduled task done. Adds it to the history and moves the next due date forward.",
  input: z.object({
    id: id("schedule"),
    done_on: date("When it was done. Defaults to today").optional(),
    note: z.string().optional(),
    cost: z.number().nonnegative().optional().describe("In dollars."),
    contact_ids: z.array(z.string()).optional().describe("Contacts who did the work. Look them up with list_contacts first."),
  }),
  run: async (input, ctx) => {
    const schedule = findSchedule(ctx, input.id);
    const doneOn = input.done_on ?? ctx.today;
    const contactIds = (input.contact_ids ?? []).map((contactId) => findContact(ctx, contactId).id);
    const completion: Completion = {
      log: {
        id: newId(),
        buildingId: ctx.building.id,
        itemId: schedule.itemId,
        scheduleId: schedule.id,
        title: schedule.title,
        doneOn,
        note: input.note?.trim() ?? "",
        cost: input.cost ?? null,
        contactIds,
      },
      ...afterDone(schedule, doneOn, ctx.building.hemisphere),
    };
    await ctx.save({ type: "completeSchedules", completions: [completion] });
    return { done_on: doneOn, ...scheduleOut(ctx, findSchedule(ctx, schedule.id)) };
  },
});

export const deleteSchedule = defineTool({
  name: "delete_schedule",
  kind: "delete",
  description: "Delete a schedule for good. Its past history stays.",
  input: z.object({ id: id("schedule") }),
  run: async (input, ctx) => {
    const schedule = findSchedule(ctx, input.id);
    await ctx.save({ type: "deleteSchedule", id: schedule.id });
    return { deleted: schedule.title };
  },
});
