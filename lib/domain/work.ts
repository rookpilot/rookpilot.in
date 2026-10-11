import type { ProjectStatus, RepairStatus, WorkKind, WorkStatus } from "./models";

interface WorkKindInfo {
  /** "Repair" */
  label: string;
  /** "Repairs" */
  plural: string;
  path: string;
  statuses: readonly WorkStatus[];
  /** The status that means it's finished. */
  finishedStatus: WorkStatus;
  defaultStatus: WorkStatus;
  startedLabel: string;
  plannedLabel: string;
  finishedLabel: string;
  hasBudget: boolean;
  empty: string;
}

const PROJECT_STATUSES: readonly ProjectStatus[] = ["idea", "planning", "in_progress", "done"];
const REPAIR_STATUSES: readonly RepairStatus[] = ["open", "in_progress", "fixed"];

export const WORK_KIND_INFO: Record<WorkKind, WorkKindInfo> = {
  project: {
    label: "Project",
    plural: "Projects",
    path: "/app/projects",
    statuses: PROJECT_STATUSES,
    finishedStatus: "done",
    defaultStatus: "idea",
    startedLabel: "Started",
    plannedLabel: "Target",
    finishedLabel: "Finished",
    hasBudget: true,
    empty: "No projects yet. Add one when you plan something new, like a fire pit or a fresh coat of paint.",
  },
  repair: {
    label: "Repair",
    plural: "Repairs",
    path: "/app/repairs",
    statuses: REPAIR_STATUSES,
    finishedStatus: "fixed",
    defaultStatus: "open",
    startedLabel: "Reported",
    plannedLabel: "Scheduled",
    finishedLabel: "Fixed",
    hasBudget: false,
    empty: "No repairs yet. Add one when something breaks so you can track it until it's fixed.",
  },
};

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  idea: "Idea",
  planning: "Planning",
  in_progress: "In progress",
  done: "Done",
  open: "Open",
  fixed: "Fixed",
};

export function isFinished(work: { kind: WorkKind; status: WorkStatus }): boolean {
  return WORK_KIND_INFO[work.kind].finishedStatus === work.status;
}

export function workHref(kind: WorkKind, id: string): string {
  return `${WORK_KIND_INFO[kind].path}?id=${encodeURIComponent(id)}`;
}
