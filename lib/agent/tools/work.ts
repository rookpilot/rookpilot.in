import * as z from "zod";
import { selectWork } from "@/lib/data/selectors";
import type { ISODate, Work, WorkKind, WorkStatus } from "@/lib/domain/models";
import { WORK_KIND_INFO } from "@/lib/domain/work";
import { date, defineTool, id, type ToolContext } from "./define";
import { findItem, findRoom, findWork, given, newId, workOut } from "./records";

// Projects and repairs. They share the `work` table, told apart by `kind`.

const kind = z
  .enum(["project", "repair"])
  .describe("project: adding or improving something. repair: fixing something that broke.");

const status = z
  .enum(["idea", "planning", "open", "in_progress", "done", "fixed"])
  .describe("Projects use idea, planning, in_progress, done. Repairs use open, in_progress, fixed.");

const optionalFields = {
  room_id: id("room").optional(),
  item_id: id("item").optional().describe("The item's id, if it's about one item. Look it up with a list tool first. Its room is used."),
  performed_by: z.enum(["diy", "hired"]).optional().describe("Who does the work. Defaults to diy."),
  budget: z.number().nonnegative().optional().describe("Projects only. In dollars."),
  planned_on: date("Target date for a project, or scheduled date for a repair").optional(),
  notes: z.string().optional(),
};

/** Throws if the status or budget doesn't fit the kind, so Claude can fix the call. */
function check(kind: WorkKind, fields: { status?: WorkStatus; budget?: number }) {
  const info = WORK_KIND_INFO[kind];
  if (fields.status && !info.statuses.includes(fields.status)) {
    throw new Error(`A ${kind} can't be ${fields.status}. Use one of: ${info.statuses.join(", ")}.`);
  }
  if (fields.budget !== undefined && !info.hasBudget) throw new Error("Only projects have a budget.");
}

/** Finishing sets the finished date (today unless given); reopening clears it. Same as the app. */
function finishedOn(kind: WorkKind, status: WorkStatus, givenDate: ISODate | undefined, previous: ISODate | null, today: ISODate) {
  if (status !== WORK_KIND_INFO[kind].finishedStatus) return null;
  return givenDate ?? previous ?? today;
}

/** Where the work is. An item brings its room along, like in the app. */
function placement(ctx: ToolContext, roomId: string | undefined, itemId: string | undefined) {
  if (itemId) {
    const item = findItem(ctx, itemId);
    if (roomId && roomId !== item.spaceId) throw new Error(`That item is in another room (${findRoom(ctx, item.spaceId).name}).`);
    return { itemId: item.id, spaceId: item.spaceId };
  }
  return roomId ? { spaceId: findRoom(ctx, roomId).id } : {};
}

export const listWork = defineTool({
  name: "list_work",
  kind: "read",
  description: "List the building's projects and repairs. Filter by kind, status, or room. Unfinished ones come first.",
  input: z.object({
    kind: kind.optional(),
    status: status.optional(),
    room_id: id("room").optional(),
  }),
  run: async (input, ctx) => {
    const kinds: WorkKind[] = input.kind ? [input.kind] : ["project", "repair"];
    return kinds
      .flatMap((k) => selectWork(ctx.data, ctx.building.id, k))
      .filter((w) => (!input.status || w.status === input.status) && (!input.room_id || w.spaceId === input.room_id))
      .map((w) => workOut(ctx, w));
  },
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
  run: async (input, ctx) => {
    check(input.kind, input);
    const status = input.status ?? WORK_KIND_INFO[input.kind].defaultStatus;
    const work: Work = {
      id: newId(),
      buildingId: ctx.building.id,
      kind: input.kind,
      title: input.title.trim(),
      status,
      spaceId: null,
      itemId: null,
      ...placement(ctx, input.room_id, input.item_id),
      performedBy: input.performed_by ?? "diy",
      cost: null,
      budget: input.budget ?? null,
      // The app's form starts the reported or started date at today too.
      startedOn: ctx.today,
      plannedOn: input.planned_on ?? null,
      finishedOn: finishedOn(input.kind, status, undefined, null, ctx.today),
      notes: input.notes?.trim() ?? "",
      contactIds: [],
    };
    await ctx.save({ type: "addWork", work });
    return workOut(ctx, work);
  },
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
    finished_on: date("When it was finished. Leave it out to use today when the status becomes done or fixed").optional(),
    ...optionalFields,
  }),
  run: async (input, ctx) => {
    const work = findWork(ctx, input.id);
    check(work.kind, input);
    const status = input.status ?? work.status;
    const patch = given({
      title: input.title?.trim(),
      status: input.status,
      cost: input.cost,
      budget: input.budget,
      performedBy: input.performed_by,
      plannedOn: input.planned_on,
      notes: input.notes?.trim(),
      ...placement(ctx, input.room_id, input.item_id),
      finishedOn: finishedOn(work.kind, status, input.finished_on, work.finishedOn, ctx.today),
    });
    await ctx.save({ type: "updateWork", id: work.id, patch });
    return workOut(ctx, findWork(ctx, work.id));
  },
});

export const deleteWork = defineTool({
  name: "delete_work",
  kind: "delete",
  description: "Delete a project or repair for good.",
  input: z.object({ id: id("project or repair") }),
  run: async (input, ctx) => {
    const work = findWork(ctx, input.id);
    await ctx.save({ type: "deleteWork", id: work.id });
    return { deleted: work.title };
  },
});
