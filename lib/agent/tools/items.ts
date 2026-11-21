import * as z from "zod";
import { buildItems } from "@/lib/data/builders";
import { date, defineTool, id, type ToolContext } from "./define";
import { count, findItem, findRoom, given, inBuilding, itemOut, newId } from "./records";

// Items: the things in each room that need upkeep (furnace, smoke detector, water heater...).

const optionalFields = {
  brand: z.string().optional(),
  model: z.string().optional(),
  installed_on: date("When it was installed").optional(),
  notes: z.string().optional(),
};

/**
 * What else a delete takes with it, for the confirm card. The database deletes the items'
 * schedules and history, and unlinks projects and repairs from them (and from the room).
 */
export function cascade(ctx: ToolContext, itemIds: string[], roomId?: string): string | undefined {
  const records = inBuilding(ctx);
  const ids = new Set(itemIds);
  const schedules = records.schedules.filter((s) => ids.has(s.itemId)).length;
  const logs = records.logs.filter((l) => ids.has(l.itemId)).length;
  const work = records.work.filter((w) => (w.itemId && ids.has(w.itemId)) || (roomId && w.spaceId === roomId)).length;

  const deleted = [
    ...(roomId ? [count(ids.size, "item")] : []),
    ...(schedules ? [count(schedules, "schedule")] : []),
    ...(logs ? [count(logs, "history entry", "history entries")] : []),
  ].filter((part) => !part.startsWith("0 "));
  const parts = [
    ...(deleted.length ? [`Also deletes ${deleted.join(", ")}.`] : []),
    ...(work ? [`${count(work, "project or repair", "projects and repairs")} ${work === 1 ? "stays" : "stay"}, unlinked.`] : []),
  ];
  return parts.length ? parts.join(" ") : undefined;
}

export const listItems = defineTool({
  name: "list_items",
  kind: "read",
  description: "List the items in the building, or in one room.",
  input: z.object({ room_id: id("room").optional() }),
  run: async (input, ctx) =>
    inBuilding(ctx)
      .items.filter((i) => !input.room_id || i.spaceId === input.room_id)
      .map((i) => itemOut(ctx, i)),
});

export const createItem = defineTool({
  name: "create_item",
  kind: "write",
  description: "Add an item to a room. It starts with no schedules; add them with create_schedule.",
  input: z.object({
    room_id: id("room"),
    name: z.string().min(1).describe('Like "Furnace" or "Smoke detector 2".'),
    ...optionalFields,
  }),
  run: async (input, ctx) => {
    const room = findRoom(ctx, input.room_id);
    const { items, schedules } = buildItems(
      {
        buildingId: ctx.building.id,
        spaceId: room.id,
        name: input.name.trim(),
        template: null,
        count: 1,
        installedOn: input.installed_on ?? null,
        hemisphere: ctx.building.hemisphere,
        today: ctx.today,
      },
      newId,
    );
    const item = { ...items[0], brand: input.brand?.trim() ?? "", model: input.model?.trim() ?? "", notes: input.notes?.trim() ?? "" };
    await ctx.save({ type: "addItems", items: [item], schedules });
    return itemOut(ctx, item);
  },
});

export const updateItem = defineTool({
  name: "update_item",
  kind: "write",
  description: "Change an item's details, or move it to another room. Its projects and repairs move with it.",
  input: z.object({
    id: id("item"),
    room_id: id("room").optional(),
    name: z.string().min(1).optional(),
    ...optionalFields,
  }),
  run: async (input, ctx) => {
    const item = findItem(ctx, input.id);
    const patch = given({
      spaceId: input.room_id && findRoom(ctx, input.room_id).id,
      name: input.name?.trim(),
      brand: input.brand?.trim(),
      model: input.model?.trim(),
      installedOn: input.installed_on,
      notes: input.notes?.trim(),
    });
    await ctx.save({ type: "updateItem", id: item.id, patch });
    return itemOut(ctx, findItem(ctx, item.id));
  },
});

export const deleteItem = defineTool({
  name: "delete_item",
  kind: "delete",
  description: "Delete an item for good, with its schedules and history. Its projects and repairs stay.",
  input: z.object({ id: id("item") }),
  effects: (input, ctx) => cascade(ctx, [input.id]),
  run: async (input, ctx) => {
    const item = findItem(ctx, input.id);
    await ctx.save({ type: "deleteItem", id: item.id });
    return { deleted: item.name };
  },
});
