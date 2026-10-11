import { Check } from "lucide-react";
import Link from "next/link";

import { DuePill } from "@/components/due-pill";
import { Button } from "@/components/ui/button";
import { itemHref } from "@/features/building/routes";
import type { AgendaEntry } from "@/lib/data/selectors";
import type { ISODate } from "@/lib/domain/models";

interface TaskRowProps {
  entry: AgendaEntry;
  today: ISODate;
  onMarkDone: (entry: AgendaEntry) => void;
}

/** A due timer: what, where, when, and a Mark done button. Used on Home and in the Schedule list. */
export function TaskRow({ entry, today, onMarkDone }: TaskRowProps) {
  const { schedule, item, space } = entry;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Link href={itemHref(space.id, item.id)} className="min-w-0 flex-1 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="block truncate text-sm font-medium">
          {schedule.title} · {item.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{space.name}</span>
      </Link>
      <DuePill nextDueOn={schedule.nextDueOn} today={today} />
      <Button variant="outline" size="sm" onClick={() => onMarkDone(entry)} aria-label={`Mark done: ${schedule.title} · ${item.name}`}>
        <Check data-icon="inline-start" />
        <span className="hidden sm:inline">Mark done</span>
        <span className="sm:hidden">Done</span>
      </Button>
    </li>
  );
}
