import { EmptyState } from "@/components/empty-state";
import { WorkStatusPill } from "@/components/work-status-pill";
import { formatShortDate } from "@/lib/dates";
import type { ISODate, Space, Work, WorkKind } from "@/lib/domain/models";
import { isFinished, WORK_KIND_INFO } from "@/lib/domain/work";
import { cn } from "@/lib/utils";

interface WorkListProps {
  kind: WorkKind;
  work: Work[];
  /** All of this kind before filtering, to tell "none yet" from "none match". */
  total: number;
  spaces: Map<string, Space>;
  selectedId: string | null;
  today: ISODate;
  onSelect: (id: string) => void;
}

/** The date that matters most for a row: when it finished, else when it's planned. */
function rowDate(work: Work, today: ISODate): string {
  const info = WORK_KIND_INFO[work.kind];
  if (isFinished(work) && work.finishedOn) return `${info.finishedLabel} ${formatShortDate(work.finishedOn, today)}`;
  if (work.plannedOn) return `${info.plannedLabel} ${formatShortDate(work.plannedOn, today)}`;
  if (work.startedOn) return `${info.startedLabel} ${formatShortDate(work.startedOn, today)}`;
  return "";
}

export function WorkList({ kind, work, total, spaces, selectedId, today, onSelect }: WorkListProps) {
  if (work.length === 0) {
    return <EmptyState>{total === 0 ? WORK_KIND_INFO[kind].empty : "Nothing with that status."}</EmptyState>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {work.map((w) => {
        const selected = w.id === selectedId;
        const subtitle = [w.spaceId ? spaces.get(w.spaceId)?.name : null, rowDate(w, today)].filter(Boolean).join(" · ");
        return (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onSelect(w.id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                selected && "border-border bg-card shadow-xs",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm font-medium", isFinished(w) && "text-muted-foreground")}>{w.title}</span>
                {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
              </span>
              <WorkStatusPill status={w.status} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
