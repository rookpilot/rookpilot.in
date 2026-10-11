import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from "date-fns";

import type { ISODate } from "./domain/models";
import type { IntervalUnit } from "./domain/schedule";

/** Local calendar date as "YYYY-MM-DD". */
export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

/** Parses "YYYY-MM-DD" as local midnight (not UTC), so the day never shifts. */
export function fromISODate(value: ISODate): Date {
  return parseISO(value);
}

const ADDERS: Record<IntervalUnit, (date: Date, amount: number) => Date> = {
  day: addDays,
  week: addWeeks,
  month: addMonths,
  year: addYears,
};

export function addInterval(value: ISODate, count: number, unit: IntervalUnit): ISODate {
  return toISODate(ADDERS[unit](fromISODate(value), count));
}

export function shiftDays(value: ISODate, days: number): ISODate {
  return toISODate(addDays(fromISODate(value), days));
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(fromISODate(to), fromISODate(from));
}

/** "Oct 12", or "Oct 12, 2027" when the year differs from `today`. */
export function formatShortDate(value: ISODate, today?: ISODate): string {
  const date = fromISODate(value);
  const sameYear = today ? date.getFullYear() === fromISODate(today).getFullYear() : true;
  return format(date, sameYear ? "MMM d" : "MMM d, yyyy");
}
