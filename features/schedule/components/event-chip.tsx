import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CalendarEvent } from "../events";

type Tone = "overdue" | "due_soon" | "ok" | "done" | "work";

const CHIP_STYLES: Record<Tone, string> = {
  overdue: "bg-overdue-soft text-overdue",
  due_soon: "bg-due-soon-soft text-due-soon",
  ok: "bg-ok-soft text-ok",
  done: "bg-ok-soft/60 text-ok",
  work: "bg-work-soft text-work",
};

const DOT_STYLES: Record<Tone, string> = {
  overdue: "bg-overdue",
  due_soon: "bg-due-soon",
  ok: "bg-ok",
  done: "bg-ok",
  work: "bg-work",
};

function tone(event: CalendarEvent): Tone {
  if (event.type === "task") return event.status === "upcoming" ? "ok" : event.status;
  return event.type;
}

/** A small solid dot in the event's color, for phone-sized month cells. */
export function EventDot({ event }: { event: CalendarEvent }) {
  return <span className={cn("size-1.5 rounded-full", DOT_STYLES[tone(event)])} />;
}

/** What a click does, for screen readers: "Mark done: Test · CO alarm". */
function actionLabel(event: CalendarEvent): string {
  if (event.type === "task") return `Mark done: ${event.label}`;
  if (event.type === "work") return `Open ${event.work.kind}: ${event.label}`;
  return `Done: ${event.label}`;
}

interface EventChipProps {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
  /** Wrap long names instead of cutting them off, where there's room. */
  wrap?: boolean;
  className?: string;
}

/** One task, completion, or project on the calendar. */
export function EventChip({ event, onOpen, wrap, className }: EventChipProps) {
  return (
    <button
      type="button"
      title={event.label}
      aria-label={actionLabel(event)}
      onClick={() => onOpen(event)}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-xs font-medium outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:brightness-125",
        CHIP_STYLES[tone(event)],
        className,
      )}
    >
      <span className={cn(wrap ? "min-w-0 break-words" : "truncate", event.type === "done" && "line-through decoration-1 opacity-80")}>{event.label}</span>
      {event.type === "done" && <Check className="size-3 shrink-0" aria-hidden="true" />}
    </button>
  );
}

/** The color key under the calendars. */
export function CalendarLegend() {
  const keys: { label: string; tone: Tone }[] = [
    { label: "Overdue", tone: "overdue" },
    { label: "Due within 14 days", tone: "due_soon" },
    { label: "Upcoming or done", tone: "ok" },
    { label: "Project or repair", tone: "work" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Color key">
      {keys.map((key) => (
        <li key={key.label} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", DOT_STYLES[key.tone])} aria-hidden="true" />
          {key.label}
        </li>
      ))}
    </ul>
  );
}
