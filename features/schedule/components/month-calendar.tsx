import { format } from "date-fns";

import { isSameMonth, monthWeeks, weekDays } from "@/lib/calendar";
import { fromISODate } from "@/lib/dates";
import type { ISODate } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

import type { CalendarEvent } from "../events";
import { EventChip, EventDot } from "./event-chip";

/** Events shown in a day before "+N more". */
const MAX_PER_DAY = 3;

interface MonthCalendarProps {
  anchor: ISODate;
  today: ISODate;
  events: Map<ISODate, CalendarEvent[]>;
  onOpen: (event: CalendarEvent) => void;
  /** Opens the week containing a day. */
  onShowDay: (day: ISODate) => void;
}

/**
 * A Google Calendar style month. Wide screens show event names; phones show colored
 * dots, and tapping a day opens its week.
 */
export function MonthCalendar({ anchor, today, events, onOpen, onShowDay }: MonthCalendarProps) {
  const weeks = monthWeeks(anchor);

  return (
    <div className="overflow-hidden surface" role="grid" aria-label={format(fromISODate(anchor), "MMMM yyyy")}>
      <div role="row" className="grid grid-cols-7 divide-x border-b bg-muted">
        {weekDays(weeks[0][0]).map((day) => (
          <span key={day} role="columnheader" className="group-label px-1.5 py-1 text-center sm:text-left">
            <span aria-hidden="true" className="sm:hidden">{format(fromISODate(day), "EEEEE")}</span>
            <span aria-hidden="true" className="hidden sm:inline">{format(fromISODate(day), "EEE")}</span>
            <span className="sr-only">{format(fromISODate(day), "EEEE")}</span>
          </span>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} role="row" className="grid grid-cols-7 divide-x border-b last:border-b-0">
          {week.map((day) => (
            <DayCell
              key={day}
              day={day}
              inMonth={isSameMonth(day, anchor)}
              isToday={day === today}
              events={events.get(day) ?? []}
              onOpen={onOpen}
              onShowDay={onShowDay}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface DayCellProps {
  day: ISODate;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  onOpen: (event: CalendarEvent) => void;
  onShowDay: (day: ISODate) => void;
}

function DayCell({ day, inMonth, isToday, events, onOpen, onShowDay }: DayCellProps) {
  const date = fromISODate(day);
  const hidden = events.length - MAX_PER_DAY;
  const dayLabel = `${format(date, "EEEE, MMMM d")}, ${events.length === 0 ? "nothing due" : `${events.length} ${events.length === 1 ? "entry" : "entries"}`}`;

  return (
    <div role="gridcell" className={cn("flex min-h-16 min-w-0 flex-col gap-1 bg-card p-1 sm:min-h-28 sm:p-1.5", !inMonth && "bg-background")}>
      <button
        type="button"
        onClick={() => onShowDay(day)}
        aria-label={`Show the week of ${dayLabel}`}
        className={cn(
          "flex h-5 min-w-6 items-center justify-center self-center rounded-full px-1.5 font-mono text-[11px] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:self-start",
          !inMonth && "opacity-50",
          isToday && "bg-primary font-semibold text-primary-foreground opacity-100 hover:bg-primary/90",
        )}
      >
        {format(date, "d")}
      </button>

      {/* Phones: dots, and the whole cell opens the week. */}
      {events.length > 0 && (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => onShowDay(day)} className="flex flex-1 flex-wrap content-start justify-center gap-0.5 sm:hidden">
          {events.slice(0, 4).map((event) => (
            <EventDot key={event.key} event={event} />
          ))}
        </button>
      )}

      {/* Wider screens: names. */}
      <ul className="hidden min-w-0 flex-col gap-0.5 sm:flex">
        {events.slice(0, MAX_PER_DAY).map((event) => (
          <li key={event.key}>
            <EventChip event={event} onOpen={onOpen} />
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={() => onShowDay(day)}
              className="w-full rounded-md px-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              +{hidden} more
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
