import * as z from "zod";
import { defineTool, id } from "./define";

// Rooms and areas of the building. The table is called `spaces`.
// TODO(next PR): every run() returns null for now. Wire them to Supabase.

const roomKind = z
  .enum(["whole_building", "bedroom", "bathroom", "kitchen", "living", "hallway", "laundry", "garage", "garden", "other"])
  .describe("garden covers yards and other outdoor areas.");

export const listRooms = defineTool({
  name: "list_rooms",
  kind: "read",
  description: "List the building's rooms and areas.",
  input: z.object({}),
  run: async () => null,
});

export const createRoom = defineTool({
  name: "create_room",
  kind: "write",
  description: "Add a room or area.",
  input: z.object({ name: z.string().min(1), kind: roomKind.optional() }),
  run: async () => null,
});

export const updateRoom = defineTool({
  name: "update_room",
  kind: "write",
  description: "Rename a room or change its kind.",
  input: z.object({ id: id("room"), name: z.string().min(1).optional(), kind: roomKind.optional() }),
  run: async () => null,
});

export const deleteRoom = defineTool({
  name: "delete_room",
  kind: "delete",
  description: "Delete a room for good, with every item in it and their schedules.",
  input: z.object({ id: id("room") }),
  run: async () => null,
});
