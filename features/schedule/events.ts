import { daysBetween } from "@/lib/dates";
import { selectAgenda, type AgendaEntry } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { ISODate, Item, LogEntry, Work } from "@/lib/domain/models";
import { isFinished } from "@/lib/domain/work";
import { getDueStatus, type DueStatus } from "@/lib/scheduling";
import { getItemTemplate } from "@/lib/templates/items";

/** What a calendar day can show. */
export type CalendarEvent =
  /** One or more timers due that day. Matching tasks are grouped: "Test · Smoke alarm (4)". */
  | { type: "task"; key: string; date: ISODate; label: string; status: DueStatus; entries: AgendaEntry[] }
  /** A timer that was marked done that day. */
  | { type: "done"; key: string; date: ISODate; label: string; log: LogEntry }
  /** A project or repair planned for that day. */
  | { type: "work"; key: string; date: ISODate; label: string; work: Work };

/** "Smoke alarm 2" → "Smoke alarm", so numbered units group together. */
function baseName(item: Item): string {
  return (item.templateKey && getItemTemplate(item.templateKey)?.name) || item.name.replace(/ \d+$/, "");
}

export function taskLabel(entries: AgendaEntry[]): string {
  const [{ schedule, item }] = entries;
  return entries.length === 1 ? `${schedule.title} · ${item.name}` : `${schedule.title} · ${baseName(item)} (${entries.length})`;
}

/** Groups timers due the same day with the same task on the same kind of item. */
export function groupTasks(entries: AgendaEntry[], today: ISODate): CalendarEvent[] {
  const groups = new Map<string, AgendaEntry[]>();
  for (const entry of entries) {
    const key = `${entry.schedule.nextDueOn}|${entry.schedule.title}|${entry.item.templateKey ?? baseName(entry.item)}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  return [...groups].map(([key, group]) => ({
    type: "task",
    key,
    date: group[0].schedule.nextDueOn,
    label: taskLabel(group),
    status: getDueStatus(group[0].schedule.nextDueOn, today),
    entries: group,
  }));
}

const EVENT_ORDER: Record<CalendarEvent["type"], number> = { task: 0, work: 1, done: 2 };

/** Everything to draw on the calendar between two dates (inclusive), by day. */
export function selectCalendarEvents(data: AppData, buildingId: string, from: ISODate, to: ISODate): Map<ISODate, CalendarEvent[]> {
  const inRange = (date: ISODate | null): date is ISODate => date !== null && date >= from && date <= to;
  const items = new Map(data.items.map((i) => [i.id, i]));

  const events: CalendarEvent[] = [
    ...groupTasks(
      selectAgenda(data, buildingId).filter((e) => inRange(e.schedule.nextDueOn)),
      data.today,
    ),
    ...data.logs
      .filter((log) => log.buildingId === buildingId && inRange(log.doneOn))
      .map((log): CalendarEvent => {
        const item = items.get(log.itemId);
        return { type: "done", key: log.id, date: log.doneOn, label: item ? `${log.title} · ${item.name}` : log.title, log };
      }),
    ...data.work
      .filter((w) => w.buildingId === buildingId && inRange(w.plannedOn))
      .map((w): CalendarEvent => ({ type: "work", key: w.id, date: w.plannedOn!, label: w.title, work: w })),
  ];

  const byDay = new Map<ISODate, CalendarEvent[]>();
  for (const event of events.sort((a, b) => EVENT_ORDER[a.type] - EVENT_ORDER[b.type] || a.label.localeCompare(b.label))) {
    const day = byDay.get(event.date);
    if (day) day.push(event);
    else byDay.set(event.date, [event]);
  }
  return byDay;
}

export type ListRow = { type: "task"; entry: AgendaEntry; date: ISODate } | { type: "work"; work: Work; date: ISODate };

export interface ListGroup {
  id: "overdue" | "week" | "month" | "later";
  label: string;
  rows: ListRow[];
}

const LIST_GROUPS: { id: ListGroup["id"]; label: string; maxDays: number }[] = [
  { id: "overdue", label: "Overdue", maxDays: -1 },
  { id: "week", label: "Next 7 days", maxDays: 7 },
  { id: "month", label: "Next 30 days", maxDays: 30 },
  { id: "later", label: "Later", maxDays: Infinity },
];

/** Active timers and unfinished, dated projects and repairs, grouped by how soon they're due. */
export function selectScheduleList(data: AppData, buildingId: string): ListGroup[] {
  const rows: ListRow[] = [
    ...selectAgenda(data, buildingId).map((entry): ListRow => ({ type: "task", entry, date: entry.schedule.nextDueOn })),
    ...data.work
      .filter((w) => w.buildingId === buildingId && w.plannedOn && !isFinished(w))
      .map((work): ListRow => ({ type: "work", work, date: work.plannedOn! })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const groups = LIST_GROUPS.map(({ id, label }) => ({ id, label, rows: [] as ListRow[] }));
  for (const row of rows) {
    const days = daysBetween(data.today, row.date);
    groups[LIST_GROUPS.findIndex((g) => days <= g.maxDays)].rows.push(row);
  }
  return groups.filter((g) => g.rows.length > 0);
}
