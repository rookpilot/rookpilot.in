import { daysBetween } from "@/lib/dates";
import type { Building, Item, Schedule, Space } from "@/lib/domain/models";
import { sortByDue } from "@/lib/scheduling";

import type { AppData } from "./types";

export function selectCurrentBuilding(data: AppData): Building | null {
  return data.buildings.find((b) => b.id === data.currentBuildingId) ?? data.buildings[0] ?? null;
}

export function selectSpaces(data: AppData, buildingId: string): Space[] {
  return data.spaces.filter((space) => space.buildingId === buildingId);
}

export function selectItemsInSpace(data: AppData, spaceId: string): Item[] {
  return data.items.filter((item) => item.spaceId === spaceId);
}

export function selectSchedulesForItem(data: AppData, itemId: string): Schedule[] {
  return data.schedules.filter((schedule) => schedule.itemId === itemId);
}

/** A timer with the item and room it belongs to. */
export interface AgendaEntry {
  schedule: Schedule;
  item: Item;
  space: Space;
}

/** Every active timer in a building, soonest first. */
export function selectAgenda(data: AppData, buildingId: string): AgendaEntry[] {
  const items = new Map(data.items.filter((i) => i.buildingId === buildingId).map((i) => [i.id, i]));
  const spaces = new Map(selectSpaces(data, buildingId).map((s) => [s.id, s]));

  return sortByDue(data.schedules.filter((s) => items.has(s.itemId))).flatMap((schedule) => {
    const item = items.get(schedule.itemId)!;
    const space = spaces.get(item.spaceId);
    return space ? [{ schedule, item, space }] : [];
  });
}

export interface BuildingSummary {
  overdue: number;
  dueThisWeek: number;
  items: number;
  timers: number;
}

export function selectBuildingSummary(data: AppData, buildingId: string): BuildingSummary {
  const agenda = selectAgenda(data, buildingId);
  let overdue = 0;
  let dueThisWeek = 0;
  for (const { schedule } of agenda) {
    const days = daysBetween(data.today, schedule.nextDueOn);
    if (days < 0) overdue++;
    else if (days <= 7) dueThisWeek++;
  }
  return {
    overdue,
    dueThisWeek,
    items: data.items.filter((i) => i.buildingId === buildingId).length,
    timers: agenda.length,
  };
}
