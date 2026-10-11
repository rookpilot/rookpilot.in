import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { HistoryKindBadge } from "@/components/history-kind-badge";
import { describeDue } from "@/lib/scheduling";
import type { AgendaEntry } from "@/lib/data/selectors";
import type { ISODate, Space } from "@/lib/domain/models";
import { WORK_STATUS_LABELS, workHref } from "@/lib/domain/work";

import type { ListGroup } from "../events";
import { TaskRow } from "./task-row";

interface ScheduleListProps {
  groups: ListGroup[];
  spaces: Map<string, Space>;
  today: ISODate;
  onMarkDone: (entry: AgendaEntry) => void;
}

/** Everything due, grouped by urgency. */
export function ScheduleList({ groups, spaces, today, onMarkDone }: ScheduleListProps) {
  if (groups.length === 0) {
    return <EmptyState>Nothing scheduled. Add items in the Building tab to start their timers.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`} className="flex flex-col gap-2">
          <h2 id={`group-${group.id}`} className="flex items-baseline gap-2 text-sm font-bold">
            {group.label}
            <span className="font-mono text-xs font-normal text-muted-foreground">{group.rows.length}</span>
          </h2>
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {group.rows.map((row) =>
              row.type === "task" ? (
                <TaskRow key={row.entry.schedule.id} entry={row.entry} today={today} onMarkDone={onMarkDone} />
              ) : (
                <li key={row.work.id}>
                  <Link href={workHref(row.work.kind, row.work.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.work.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[row.work.spaceId && spaces.get(row.work.spaceId)?.name, WORK_STATUS_LABELS[row.work.status]].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <HistoryKindBadge kind={row.work.kind} />
                    <span className="shrink-0 font-mono text-[11px] text-work">{describeDue(row.date, today)}</span>
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
