import { EmptyState } from "@/components/empty-state";
import { TaskRow } from "@/features/schedule/components/task-row";
import type { AgendaEntry } from "@/lib/data/selectors";
import type { ISODate } from "@/lib/domain/models";

interface NextUpListProps {
  entries: AgendaEntry[];
  today: ISODate;
  onMarkDone: (entry: AgendaEntry) => void;
}

export function NextUpList({ entries, today, onMarkDone }: NextUpListProps) {
  if (entries.length === 0) {
    return <EmptyState>Nothing to track yet. Add items in the Building tab to start their timers.</EmptyState>;
  }

  return (
    <ul className="flex flex-col divide-y overflow-hidden surface">
      {entries.map((entry) => (
        <TaskRow key={entry.schedule.id} entry={entry} today={today} onMarkDone={onMarkDone} />
      ))}
    </ul>
  );
}
