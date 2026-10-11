import type { WorkKind } from "./models";

export type HistoryKind = "task" | WorkKind;

export const HISTORY_KIND_LABELS: Record<HistoryKind, string> = {
  task: "Task",
  repair: "Repair",
  project: "Project",
};
