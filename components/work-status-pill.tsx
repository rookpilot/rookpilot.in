import type { WorkStatus } from "@/lib/domain/models";
import { WORK_STATUS_LABELS } from "@/lib/domain/work";
import { cn } from "@/lib/utils";

const STYLES: Record<WorkStatus, string> = {
  idea: "bg-muted text-muted-foreground",
  planning: "bg-muted text-foreground",
  open: "bg-due-soon-soft text-due-soon",
  in_progress: "bg-work-soft text-work",
  done: "bg-ok-soft text-ok",
  fixed: "bg-ok-soft text-ok",
};

export function WorkStatusPill({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[11px] whitespace-nowrap", STYLES[status], className)}>
      {WORK_STATUS_LABELS[status]}
    </span>
  );
}
