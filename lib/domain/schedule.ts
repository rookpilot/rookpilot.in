export type IntervalUnit = "day" | "week" | "month" | "year";

export type Season = "spring" | "summer" | "fall" | "winter";

/** How often a maintenance task repeats: a fixed interval, or at the start of given seasons. */
export type RepeatRule =
  | { kind: "interval"; count: number; unit: IntervalUnit }
  | { kind: "seasonal"; seasons: Season[] };

export interface ScheduleTemplate {
  title: string;
  repeat: RepeatRule;
}

const UNIT_SHORT: Record<IntervalUnit, string> = { day: "d", week: "wk", month: "mo", year: "yr" };

const SINGULAR_PHRASE: Record<IntervalUnit, string> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

/** "monthly", "every 3 mo", "spring + fall". */
export function formatRepeat(rule: RepeatRule): string {
  if (rule.kind === "seasonal") return rule.seasons.join(" + ");
  if (rule.count === 1) return SINGULAR_PHRASE[rule.unit];
  return `every ${rule.count} ${UNIT_SHORT[rule.unit]}`;
}

/** "Test monthly · Battery yearly · Replace every 10 yr". */
export function formatSchedules(schedules: ScheduleTemplate[]): string {
  return schedules.map((s) => `${s.title} ${formatRepeat(s.repeat)}`).join(" · ");
}
