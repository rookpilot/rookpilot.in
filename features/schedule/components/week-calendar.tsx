import { format } from "date-fns";

import { weekDays } from "@/lib/calendar";
import { fromISODate } from "@/lib/dates";
import type { ISODate } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

import type { CalendarEvent } from "../events";
import { EventChip } from "./event-chip";

interface WeekCalendarProps {
  anchor: ISODate;
  today: ISODate;
  events: Map<ISODate, CalendarEvent[]>;
  onOpen: (event: CalendarEvent) => void;
}

/** Seven columns on wide screens; a list of days on phones. */
export function WeekCalendar({ anchor, today, events, onOpen }: WeekCalendarProps) {
  return (
    <ol className="grid grid-cols-1 gap-1.5 lg:grid-cols-7">
      {weekDays(anchor).map((day) => {
        const date = fromISODate(day);
        const dayEvents = events.get(day) ?? [];
        const isToday = day === today;
        return (
          <li
            key={day}
            className={cn("flex min-w-0 gap-3 rounded-md border bg-card px-3 py-2.5 lg:min-h-80 lg:flex-col lg:gap-2 lg:px-2", isToday && "border-foreground/40")}
          >
            <h3 className="flex w-12 shrink-0 flex-col items-center lg:w-auto lg:flex-row lg:justify-between">
              <span className="group-label">{format(date, "EEE")}</span>
              <span
                className={cn(
                  "flex h-6 min-w-7 items-center justify-center rounded-full px-1.5 font-mono text-xs text-muted-foreground",
                  isToday && "bg-primary font-semibold text-primary-foreground",
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {format(date, "d")}
              </span>
              <span className="sr-only">{format(date, "MMMM d")}</span>
            </h3>
            {dayEvents.length === 0 ? (
              <p className="self-center text-xs text-muted-foreground lg:hidden">Nothing due</p>
            ) : (
              <ul className="flex min-w-0 flex-1 flex-col gap-1">
                {dayEvents.map((event) => (
                  <li key={event.key}>
                    <EventChip event={event} onOpen={onOpen} wrap className="py-1" />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
