import Link from "next/link";

import { DuePill } from "@/components/due-pill";
import type { AgendaEntry } from "@/lib/data/selectors";
import type { ISODate } from "@/lib/domain/models";

import { itemHref } from "@/features/building/routes";

interface NextUpListProps {
  entries: AgendaEntry[];
  today: ISODate;
}

export function NextUpList({ entries, today }: NextUpListProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nothing to track yet. Add items in the Building tab to start their timers.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y rounded-xl border bg-card">
      {entries.map(({ schedule, item, space }) => (
        <li key={schedule.id}>
          <Link href={itemHref(space.id, item.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {schedule.title} · {item.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{space.name}</span>
            </span>
            <DuePill nextDueOn={schedule.nextDueOn} today={today} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
