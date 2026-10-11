import type { CalendarView } from "@/lib/calendar";
import type { ISODate } from "@/lib/domain/models";

export const SCHEDULE_PATH = "/app/schedule";

export function scheduleHref(view: CalendarView, date?: ISODate): string {
  const params = new URLSearchParams({ view });
  if (date && view !== "list") params.set("date", date);
  return `${SCHEDULE_PATH}?${params}`;
}
