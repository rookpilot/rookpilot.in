import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

import { fromISODate, shiftDays, toISODate } from "./dates";
import type { ISODate } from "./domain/models";

/** Calendar weeks start on Sunday, like Google Calendar in the US. */
const WEEK = { weekStartsOn: 0 } as const;

export type CalendarView = "list" | "week" | "month";
export const CALENDAR_VIEWS: readonly CalendarView[] = ["list", "week", "month"];

export function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === "string" && (CALENDAR_VIEWS as readonly string[]).includes(value);
}

/** The 7 days of the week containing `anchor`, Sunday first. */
export function weekDays(anchor: ISODate): ISODate[] {
  const start = toISODate(startOfWeek(fromISODate(anchor), WEEK));
  return Array.from({ length: 7 }, (_, i) => shiftDays(start, i));
}

/** The month containing `anchor` as whole weeks, including the days from the months either side. */
export function monthWeeks(anchor: ISODate): ISODate[][] {
  const date = fromISODate(anchor);
  const first = toISODate(startOfWeek(startOfMonth(date), WEEK));
  const last = toISODate(endOfWeek(endOfMonth(date), WEEK));
  const weeks: ISODate[][] = [];
  for (let day = first; day <= last; day = shiftDays(day, 7)) weeks.push(weekDays(day));
  return weeks;
}

/** First and last day a view shows. */
export function visibleRange(view: Exclude<CalendarView, "list">, anchor: ISODate): { from: ISODate; to: ISODate } {
  const days = view === "week" ? weekDays(anchor) : monthWeeks(anchor).flat();
  return { from: days[0], to: days[days.length - 1] };
}

/** The anchor one week or month earlier (-1) or later (1). Months land on the 1st. */
export function shiftAnchor(view: Exclude<CalendarView, "list">, anchor: ISODate, step: -1 | 1): ISODate {
  if (view === "week") return shiftDays(anchor, step * 7);
  return toISODate(startOfMonth(addMonths(fromISODate(anchor), step)));
}

/** "October 2026", or a week as "Oct 11 – 17, 2026" / "Dec 27, 2026 – Jan 2, 2027". */
export function rangeLabel(view: Exclude<CalendarView, "list">, anchor: ISODate): string {
  if (view === "month") return format(fromISODate(anchor), "MMMM yyyy");
  const days = weekDays(anchor);
  const start = fromISODate(days[0]);
  const end = fromISODate(days[6]);
  if (start.getFullYear() !== end.getFullYear()) return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  if (start.getMonth() !== end.getMonth()) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}
