import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { HistoryKindBadge } from "@/components/history-kind-badge";
import { WorkStatusPill } from "@/components/work-status-pill";
import type { Space, Work } from "@/lib/domain/models";
import { workHref } from "@/lib/domain/work";

interface InProgressListProps {
  work: Work[];
  spaces: Map<string, Space>;
}

/** Unfinished projects and repairs, for Home. */
export function InProgressList({ work, spaces }: InProgressListProps) {
  if (work.length === 0) return <EmptyState>No open projects or repairs.</EmptyState>;
  return (
    <ul className="flex flex-col divide-y overflow-hidden surface">
      {work.map((w) => (
        <li key={w.id}>
          <Link href={workHref(w.kind, w.id)} className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50">
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.title}</span>
              <WorkStatusPill status={w.status} />
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <HistoryKindBadge kind={w.kind} />
              {w.spaceId && spaces.get(w.spaceId)?.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
