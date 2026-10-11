import { HISTORY_KIND_LABELS, type HistoryKind } from "@/lib/domain/history";
import { cn } from "@/lib/utils";

const STYLES: Record<HistoryKind, string> = {
  task: "bg-ok-soft text-ok",
  repair: "bg-work-soft text-work",
  project: "bg-work-soft text-work",
};

export function HistoryKindBadge({ kind, className }: { kind: HistoryKind; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[11px]", STYLES[kind], className)}>
      {HISTORY_KIND_LABELS[kind]}
    </span>
  );
}
