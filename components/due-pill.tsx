import type { ISODate } from "@/lib/domain/models";
import { describeDue, getDueStatus, type DueStatus } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DueStatus, string> = {
  overdue: "bg-overdue-soft text-overdue",
  due_soon: "bg-due-soon-soft text-due-soon",
  upcoming: "bg-ok-soft text-ok",
};

interface DuePillProps {
  nextDueOn: ISODate;
  today: ISODate;
  paused?: boolean;
  className?: string;
}

/** "3 days late", "In 2 days", "Nov 1", colored by urgency. */
export function DuePill({ nextDueOn, today, paused, className }: DuePillProps) {
  const base = "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[11px] whitespace-nowrap";
  if (paused) return <span className={cn(base, "bg-muted text-muted-foreground", className)}>Paused</span>;
  return <span className={cn(base, STATUS_STYLES[getDueStatus(nextDueOn, today)], className)}>{describeDue(nextDueOn, today)}</span>;
}
