import * as z from "zod";
import { date, defineTool, id } from "./define";

// Items: the things in each room that need upkeep (furnace, smoke detector, water heater...).
// TODO(next PR): every run() returns null for now. Wire them to Supabase.

const optionalFields = {
  brand: z.string().optional(),
  model: z.string().optional(),
  installed_on: date("When it was installed").optional(),
  notes: z.string().optional(),
};

export const listItems = defineTool({
  name: "list_items",
  kind: "read",
  description: "List the items in the building, or in one room.",
  input: z.object({ room_id: id("room").optional() }),
  run: async () => null,
});

export const createItem = defineTool({
  name: "create_item",
  kind: "write",
  description: "Add an item to a room.",
  input: z.object({
    room_id: id("room"),
    name: z.string().min(1).describe('Like "Furnace" or "Smoke detector 2".'),
    ...optionalFields,
  }),
  run: async () => null,
});

export const updateItem = defineTool({
  name: "update_item",
  kind: "write",
  description: "Change an item's details, or move it to another room.",
  input: z.object({
    id: id("item"),
    room_id: id("room").optional(),
    name: z.string().min(1).optional(),
    ...optionalFields,
  }),
  run: async () => null,
});

export const deleteItem = defineTool({
  name: "delete_item",
  kind: "delete",
  description: "Delete an item for good, with its schedules.",
  input: z.object({ id: id("item") }),
  run: async () => null,
});
