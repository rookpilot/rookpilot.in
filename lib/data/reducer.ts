import type { Building, Item, Schedule, Space } from "@/lib/domain/models";

import type { AppData, NewItems } from "./types";

export type DataAction =
  | { type: "selectBuilding"; id: string }
  | { type: "addBuilding"; building: Building; spaces: Space[]; items: Item[]; schedules: Schedule[] }
  | { type: "addSpace"; space: Space }
  | { type: "updateSpace"; id: string; patch: Partial<Pick<Space, "name" | "kind">> }
  | { type: "deleteSpace"; id: string }
  | ({ type: "addItems" } & NewItems)
  | { type: "updateItem"; id: string; patch: Partial<Omit<Item, "id" | "buildingId">> }
  | { type: "deleteItem"; id: string }
  | { type: "addSchedule"; schedule: Schedule }
  | { type: "updateSchedule"; id: string; patch: Partial<Omit<Schedule, "id" | "itemId">> }
  | { type: "deleteSchedule"; id: string };

function patchById<T extends { id: string }>(list: T[], id: string, patch: NoInfer<Partial<T>>): T[] {
  return list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}

/** Removes items and every schedule that belongs to them. */
function withoutItems(state: AppData, itemIds: Set<string>): Pick<AppData, "items" | "schedules"> {
  return {
    items: state.items.filter((item) => !itemIds.has(item.id)),
    schedules: state.schedules.filter((schedule) => !itemIds.has(schedule.itemId)),
  };
}

export function dataReducer(state: AppData, action: DataAction): AppData {
  switch (action.type) {
    case "selectBuilding":
      return state.buildings.some((b) => b.id === action.id) ? { ...state, currentBuildingId: action.id } : state;

    case "addBuilding":
      return {
        ...state,
        buildings: [...state.buildings, action.building],
        spaces: [...state.spaces, ...action.spaces],
        items: [...state.items, ...action.items],
        schedules: [...state.schedules, ...action.schedules],
        currentBuildingId: action.building.id,
      };

    case "addSpace":
      return { ...state, spaces: [...state.spaces, action.space] };
    case "updateSpace":
      return { ...state, spaces: patchById(state.spaces, action.id, action.patch) };
    case "deleteSpace": {
      const itemIds = new Set(state.items.filter((item) => item.spaceId === action.id).map((item) => item.id));
      return { ...state, spaces: state.spaces.filter((s) => s.id !== action.id), ...withoutItems(state, itemIds) };
    }

    case "addItems":
      return { ...state, items: [...state.items, ...action.items], schedules: [...state.schedules, ...action.schedules] };
    case "updateItem":
      return { ...state, items: patchById(state.items, action.id, action.patch) };
    case "deleteItem":
      return { ...state, ...withoutItems(state, new Set([action.id])) };

    case "addSchedule":
      return { ...state, schedules: [...state.schedules, action.schedule] };
    case "updateSchedule":
      return { ...state, schedules: patchById(state.schedules, action.id, action.patch) };
    case "deleteSchedule":
      return { ...state, schedules: state.schedules.filter((s) => s.id !== action.id) };
  }
}
