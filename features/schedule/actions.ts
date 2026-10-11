import { dispatch, newId } from "@/lib/data/store";
import type { AgendaEntry } from "@/lib/data/selectors";
import type { Completion } from "@/lib/data/reducer";
import type { Building, ISODate } from "@/lib/domain/models";
import { afterDone } from "@/lib/scheduling";

export interface MarkDoneForm {
  doneOn: ISODate;
  note: string;
  cost: number | null;
  contactIds: string[];
}

/** Logs each timer as done and moves it to its next due date. */
export function markDone(building: Building, entries: AgendaEntry[], form: MarkDoneForm) {
  const completions: Completion[] = entries.map(({ schedule, item }) => ({
    log: {
      id: newId(),
      buildingId: building.id,
      itemId: item.id,
      scheduleId: schedule.id,
      title: schedule.title,
      doneOn: form.doneOn,
      note: form.note.trim(),
      cost: form.cost,
      contactIds: form.contactIds,
    },
    ...afterDone(schedule, form.doneOn, building.hemisphere),
  }));
  dispatch({ type: "completeSchedules", completions });
}
