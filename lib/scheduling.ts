import { addInterval, daysBetween, formatShortDate, toISODate } from "./dates";
import type { Hemisphere, ISODate, Schedule } from "./domain/models";
import type { RepeatRule, Season } from "./domain/schedule";

/** Month (1–12) each season starts, in the northern hemisphere. */
const NORTH_SEASON_START: Record<Season, number> = { spring: 3, summer: 6, fall: 9, winter: 12 };

function seasonStartMonth(season: Season, hemisphere: Hemisphere): number {
  const month = NORTH_SEASON_START[season];
  return hemisphere === "north" ? month : ((month + 5) % 12) + 1;
}

/** First day of the next listed season strictly after `from`. */
function nextSeasonStart(seasons: readonly Season[], from: ISODate, hemisphere: Hemisphere): ISODate {
  const year = Number(from.slice(0, 4));
  const candidates = [year, year + 1].flatMap((y) =>
    seasons.map((season) => toISODate(new Date(y, seasonStartMonth(season, hemisphere) - 1, 1))),
  );
  return candidates.filter((date) => date > from).sort()[0];
}

/**
 * When a task is next due, counting from `from`: the last time it was done,
 * or the install date or date added when it has never been done.
 */
export function computeNextDue(rule: RepeatRule, from: ISODate, hemisphere: Hemisphere = "north"): ISODate {
  if (rule.kind === "interval") return addInterval(from, rule.count, rule.unit);
  return nextSeasonStart(rule.seasons, from, hemisphere);
}

export const DUE_SOON_DAYS = 14;

export type DueStatus = "overdue" | "due_soon" | "upcoming";

export function getDueStatus(nextDueOn: ISODate, today: ISODate): DueStatus {
  const days = daysBetween(today, nextDueOn);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due_soon";
  return "upcoming";
}

/** Short, human description: "3 days late", "Due today", "In 2 days", "Nov 1". */
export function describeDue(nextDueOn: ISODate, today: ISODate): string {
  const days = daysBetween(today, nextDueOn);
  if (days < -1) return `${-days} days late`;
  if (days === -1) return "1 day late";
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  if (days <= DUE_SOON_DAYS) return `In ${days} days`;
  return formatShortDate(nextDueOn, today);
}

/** Active schedules, soonest first. */
export function sortByDue<T extends Pick<Schedule, "nextDueOn" | "active">>(schedules: T[]): T[] {
  return schedules.filter((s) => s.active).sort((a, b) => a.nextDueOn.localeCompare(b.nextDueOn));
}
