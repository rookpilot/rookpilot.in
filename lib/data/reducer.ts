import type { Building, Contact, ISODate, Item, LogEntry, Schedule, Space, Work } from "@/lib/domain/models";

import type { AppData, NewItems } from "./types";

/** One timer marked done: its log entry and where the timer moves to. */
export interface Completion {
  log: LogEntry;
  lastDoneOn: ISODate;
  nextDueOn: ISODate;
}

export type DataAction =
  | { type: "selectBuilding"; id: string }
  | { type: "addBuilding"; building: Building; spaces: Space[]; items: Item[]; schedules: Schedule[] }
  | { type: "updateBuilding"; id: string; patch: Partial<Omit<Building, "id">> }
  | { type: "deleteBuilding"; id: string }
  | { type: "addSpace"; space: Space }
  | { type: "updateSpace"; id: string; patch: Partial<Pick<Space, "name" | "kind">> }
  | { type: "deleteSpace"; id: string }
  | ({ type: "addItems" } & NewItems)
  | { type: "updateItem"; id: string; patch: Partial<Omit<Item, "id" | "buildingId">> }
  | { type: "deleteItem"; id: string }
  | { type: "addSchedule"; schedule: Schedule }
  | { type: "updateSchedule"; id: string; patch: Partial<Omit<Schedule, "id" | "itemId">> }
  | { type: "deleteSchedule"; id: string }
  | { type: "completeSchedules"; completions: Completion[] }
  | { type: "deleteLog"; id: string }
  | { type: "addContact"; contact: Contact }
  | { type: "updateContact"; id: string; patch: Partial<Omit<Contact, "id">> }
  | { type: "deleteContact"; id: string }
  | { type: "addWork"; work: Work }
  | { type: "updateWork"; id: string; patch: Partial<Omit<Work, "id" | "buildingId" | "kind">> }
  | { type: "deleteWork"; id: string };

function patchById<T extends { id: string }>(list: T[], id: string, patch: NoInfer<Partial<T>>): T[] {
  return list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}

/**
 * Removes items with their timers and history. Projects and repairs that pointed at
 * a removed item or room keep their place in the list but lose the link.
 */
function withoutItems(state: AppData, itemIds: Set<string>, spaceIds = new Set<string>()): Pick<AppData, "items" | "schedules" | "logs" | "work"> {
  return {
    items: state.items.filter((item) => !itemIds.has(item.id)),
    schedules: state.schedules.filter((schedule) => !itemIds.has(schedule.itemId)),
    logs: state.logs.filter((log) => !itemIds.has(log.itemId)),
    work: state.work.map((w) => {
      const lostSpace = w.spaceId !== null && spaceIds.has(w.spaceId);
      const lostItem = w.itemId !== null && itemIds.has(w.itemId);
      if (!lostSpace && !lostItem) return w;
      return { ...w, spaceId: lostSpace ? null : w.spaceId, itemId: null };
    }),
  };
}

function withoutContact<T extends { contactIds: string[] }>(list: T[], contactId: string): T[] {
  return list.map((entry) =>
    entry.contactIds.includes(contactId) ? { ...entry, contactIds: entry.contactIds.filter((id) => id !== contactId) } : entry,
  );
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
    case "updateBuilding":
      return { ...state, buildings: patchById(state.buildings, action.id, action.patch) };
    case "deleteBuilding": {
      const keep = <T extends { buildingId: string }>(list: T[]) => list.filter((entry) => entry.buildingId !== action.id);
      const itemIds = new Set(state.items.filter((i) => i.buildingId === action.id).map((i) => i.id));
      const buildings = state.buildings.filter((b) => b.id !== action.id);
      return {
        ...state,
        buildings,
        spaces: keep(state.spaces),
        items: keep(state.items),
        schedules: state.schedules.filter((s) => !itemIds.has(s.itemId)),
        logs: keep(state.logs),
        work: keep(state.work),
        currentBuildingId: state.currentBuildingId === action.id ? (buildings[0]?.id ?? null) : state.currentBuildingId,
      };
    }

    case "addSpace":
      return { ...state, spaces: [...state.spaces, action.space] };
    case "updateSpace":
      return { ...state, spaces: patchById(state.spaces, action.id, action.patch) };
    case "deleteSpace": {
      const itemIds = new Set(state.items.filter((item) => item.spaceId === action.id).map((item) => item.id));
      return { ...state, spaces: state.spaces.filter((s) => s.id !== action.id), ...withoutItems(state, itemIds, new Set([action.id])) };
    }

    case "addItems":
      return { ...state, items: [...state.items, ...action.items], schedules: [...state.schedules, ...action.schedules] };
    case "updateItem": {
      const moved = action.patch.spaceId;
      return {
        ...state,
        items: patchById(state.items, action.id, action.patch),
        // Work linked to the item follows it to its new room.
        work: moved ? state.work.map((w) => (w.itemId === action.id ? { ...w, spaceId: moved } : w)) : state.work,
      };
    }
    case "deleteItem":
      return { ...state, ...withoutItems(state, new Set([action.id])) };

    case "addSchedule":
      return { ...state, schedules: [...state.schedules, action.schedule] };
    case "updateSchedule":
      return { ...state, schedules: patchById(state.schedules, action.id, action.patch) };
    case "deleteSchedule":
      return {
        ...state,
        schedules: state.schedules.filter((s) => s.id !== action.id),
        // History stays; it just no longer points at a timer.
        logs: state.logs.map((log) => (log.scheduleId === action.id ? { ...log, scheduleId: null } : log)),
      };
    case "completeSchedules": {
      const byId = new Map(action.completions.map((c) => [c.log.scheduleId, c]));
      return {
        ...state,
        logs: [...state.logs, ...action.completions.map((c) => c.log)],
        schedules: state.schedules.map((s) => {
          const done = byId.get(s.id);
          return done ? { ...s, lastDoneOn: done.lastDoneOn, nextDueOn: done.nextDueOn } : s;
        }),
      };
    }
    case "deleteLog":
      return { ...state, logs: state.logs.filter((log) => log.id !== action.id) };

    case "addContact":
      return { ...state, contacts: [...state.contacts, action.contact] };
    case "updateContact":
      return { ...state, contacts: patchById(state.contacts, action.id, action.patch) };
    case "deleteContact":
      // The work and logs stay; only the tag is removed.
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
        logs: withoutContact(state.logs, action.id),
        work: withoutContact(state.work, action.id),
      };

    case "addWork":
      return { ...state, work: [...state.work, action.work] };
    case "updateWork":
      return { ...state, work: patchById(state.work, action.id, action.patch) };
    case "deleteWork":
      return { ...state, work: state.work.filter((w) => w.id !== action.id) };
  }
}
