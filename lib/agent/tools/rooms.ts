import * as z from "zod";
import { defineTool, id } from "./define";
import { cascade } from "./items";
import { findRoom, given, inBuilding, newId, roomOut } from "./records";

// Rooms and areas of the building. The table is called `spaces`.

const roomKind = z
  .enum(["whole_building", "bedroom", "bathroom", "kitchen", "living", "hallway", "laundry", "garage", "garden", "other"])
  .describe("garden covers yards and other outdoor areas.");

export const listRooms = defineTool({
  name: "list_rooms",
  kind: "read",
  description: "List the building's rooms and areas, with how many items each has.",
  input: z.object({}),
  run: async (_input, ctx) => inBuilding(ctx).rooms.map((room) => roomOut(ctx, room)),
});

export const createRoom = defineTool({
  name: "create_room",
  kind: "write",
  description: "Add a room or area.",
  input: z.object({ name: z.string().min(1), kind: roomKind.optional().describe("Defaults to other.") }),
  run: async (input, ctx) => {
    const room = { id: newId(), buildingId: ctx.building.id, name: input.name.trim(), kind: input.kind ?? "other" };
    await ctx.save({ type: "addSpace", space: room });
    return roomOut(ctx, room);
  },
});

export const updateRoom = defineTool({
  name: "update_room",
  kind: "write",
  description: "Rename a room or change its kind.",
  input: z.object({ id: id("room"), name: z.string().min(1).optional(), kind: roomKind.optional() }),
  run: async (input, ctx) => {
    const room = findRoom(ctx, input.id);
    await ctx.save({ type: "updateSpace", id: room.id, patch: given({ name: input.name?.trim(), kind: input.kind }) });
    return roomOut(ctx, findRoom(ctx, room.id));
  },
});

export const deleteRoom = defineTool({
  name: "delete_room",
  kind: "delete",
  description: "Delete a room for good, with every item in it and their schedules and history. Projects and repairs in it stay.",
  input: z.object({ id: id("room") }),
  effects: (input, ctx) => {
    const itemIds = inBuilding(ctx).items.filter((i) => i.spaceId === input.id).map((i) => i.id);
    return cascade(ctx, itemIds, input.id);
  },
  run: async (input, ctx) => {
    const room = findRoom(ctx, input.id);
    await ctx.save({ type: "deleteSpace", id: room.id });
    return { deleted: room.name };
  },
});
