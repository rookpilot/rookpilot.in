import { dispatch, newId } from "@/lib/data/store";
import type { AppData } from "@/lib/data/types";
import type { Building, Work, WorkKind, WorkStatus } from "@/lib/domain/models";
import { WORK_KIND_INFO } from "@/lib/domain/work";

export type WorkForm = Omit<Work, "id" | "buildingId" | "kind" | "finishedOn">;

/** Every change the Projects and Repairs tabs can make. */
export function createWorkActions(data: AppData, building: Building, kind: WorkKind) {
  const info = WORK_KIND_INFO[kind];

  /** Finishing sets the finished date to today; reopening clears it. */
  function finishedOn(status: WorkStatus, previous: Work | null) {
    if (status !== info.finishedStatus) return null;
    return previous?.finishedOn ?? data.today;
  }

  function clean(form: WorkForm): WorkForm {
    return { ...form, title: form.title.trim(), notes: form.notes.trim(), budget: info.hasBudget ? form.budget : null };
  }

  return {
    add(form: WorkForm): string {
      const id = newId();
      dispatch({ type: "addWork", work: { id, buildingId: building.id, kind, ...clean(form), finishedOn: finishedOn(form.status, null) } });
      return id;
    },
    update(work: Work, form: WorkForm) {
      dispatch({ type: "updateWork", id: work.id, patch: { ...clean(form), finishedOn: finishedOn(form.status, work) } });
    },
    setStatus(work: Work, status: WorkStatus) {
      dispatch({ type: "updateWork", id: work.id, patch: { status, finishedOn: finishedOn(status, work) } });
    },
    remove(id: string) {
      dispatch({ type: "deleteWork", id });
    },
  };
}

export type WorkActions = ReturnType<typeof createWorkActions>;
