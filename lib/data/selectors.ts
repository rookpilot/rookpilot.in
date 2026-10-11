import { daysBetween } from "@/lib/dates";
import type { Building, Contact, ISODate, Item, LogEntry, Schedule, Space, Work, WorkKind } from "@/lib/domain/models";
import { isFinished } from "@/lib/domain/work";
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
  openRepairs: number;
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
    openRepairs: data.work.filter((w) => w.buildingId === buildingId && w.kind === "repair" && !isFinished(w)).length,
    items: data.items.filter((i) => i.buildingId === buildingId).length,
    timers: agenda.length,
  };
}

/** Contacts A–Z. */
export function selectContacts(data: AppData): Contact[] {
  return [...data.contacts].sort((a, b) => a.name.localeCompare(b.name));
}

export function selectContactsById(data: AppData): Map<string, Contact> {
  return new Map(data.contacts.map((c) => [c.id, c]));
}

/**
 * A building's projects or repairs. Unfinished ones come first, soonest planned date first;
 * finished ones follow, most recently finished first.
 */
export function selectWork(data: AppData, buildingId: string, kind: WorkKind): Work[] {
  const rank = (w: Work) => (isFinished(w) ? 1 : 0);
  return data.work
    .filter((w) => w.buildingId === buildingId && w.kind === kind)
    .sort((a, b) => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (isFinished(a)) return (b.finishedOn ?? "").localeCompare(a.finishedOn ?? "");
      return (a.plannedOn ?? "9999").localeCompare(b.plannedOn ?? "9999") || (b.startedOn ?? "").localeCompare(a.startedOn ?? "");
    });
}

export function selectLogsForItem(data: AppData, itemId: string): LogEntry[] {
  return data.logs.filter((log) => log.itemId === itemId).sort((a, b) => b.doneOn.localeCompare(a.doneOn));
}

/** One finished thing in History: a completed timer, a fixed repair, or a finished project. */
export type HistoryEntry =
  | { kind: "task"; id: string; date: ISODate; log: LogEntry; item: Item | null; space: Space | null }
  | { kind: "repair" | "project"; id: string; date: ISODate; work: Work; item: Item | null; space: Space | null };

/**
 * Completions and finished work as History entries, newest first. With `includeOpen`,
 * unfinished work is listed too, dated by when it's planned or started.
 */
function toHistory(data: AppData, logs: LogEntry[], work: Work[], includeOpen = false): HistoryEntry[] {
  const items = new Map(data.items.map((i) => [i.id, i]));
  const spaces = new Map(data.spaces.map((s) => [s.id, s]));

  const fromLogs: HistoryEntry[] = logs.map((log) => {
    const item = items.get(log.itemId) ?? null;
    return { kind: "task", id: log.id, date: log.doneOn, log, item, space: item ? (spaces.get(item.spaceId) ?? null) : null };
  });
  const fromWork: HistoryEntry[] = work.flatMap((w) => {
    const date = isFinished(w) ? w.finishedOn : includeOpen ? (w.plannedOn ?? w.startedOn ?? data.today) : null;
    if (!date) return [];
    return [
      {
        kind: w.kind,
        id: w.id,
        date,
        work: w,
        item: w.itemId ? (items.get(w.itemId) ?? null) : null,
        space: w.spaceId ? (spaces.get(w.spaceId) ?? null) : null,
      },
    ];
  });

  return [...fromLogs, ...fromWork].sort((a, b) => b.date.localeCompare(a.date));
}

/** Everything finished in a building, newest first. */
export function selectHistory(data: AppData, buildingId: string): HistoryEntry[] {
  return toHistory(
    data,
    data.logs.filter((log) => log.buildingId === buildingId),
    data.work.filter((w) => w.buildingId === buildingId),
  );
}

/** A contact's "Helped with" list across every building: tagged tasks, repairs, and projects (finished or not), newest first. */
export function selectContactHistory(data: AppData, contactId: string): HistoryEntry[] {
  return toHistory(
    data,
    data.logs.filter((log) => log.contactIds.includes(contactId)),
    data.work.filter((w) => w.contactIds.includes(contactId)),
    true,
  );
}

export function historyCost(entry: HistoryEntry): number | null {
  return entry.kind === "task" ? entry.log.cost : entry.work.cost;
}

export function historyContactIds(entry: HistoryEntry): string[] {
  return entry.kind === "task" ? entry.log.contactIds : entry.work.contactIds;
}

export function historyTitle(entry: HistoryEntry): string {
  if (entry.kind !== "task") return entry.work.title;
  return entry.item ? `${entry.log.title} · ${entry.item.name}` : entry.log.title;
}
