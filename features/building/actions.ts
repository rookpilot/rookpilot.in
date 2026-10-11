import { buildItems, buildSchedule } from "@/lib/data/builders";
import { dispatch, newId } from "@/lib/data/store";
import type { AppData } from "@/lib/data/types";
import type { Building, ISODate, Item, Schedule } from "@/lib/domain/models";
import type { RoomKind } from "@/lib/domain/room";
import type { RepeatRule } from "@/lib/domain/schedule";
import { computeNextDue } from "@/lib/scheduling";
import { getItemTemplate } from "@/lib/templates/items";

export interface NewItemForm {
  spaceId: string;
  templateKey: string | null;
  name: string;
  count: number;
  installedOn: ISODate | null;
}

export interface ScheduleForm {
  title: string;
  repeat: RepeatRule;
}

/** Every change the Building tab can make. Ids and dates are filled in here, not in components. */
export function createBuildingActions(data: AppData, building: Building) {
  /** Where a timer counts from when it has never been done. */
  const startDate = (item: Item) => item.installedOn ?? data.today;

  return {
    addRoom(name: string, kind: RoomKind) {
      const id = newId();
      dispatch({ type: "addSpace", space: { id, buildingId: building.id, name: name.trim(), kind } });
      return id;
    },
    updateRoom(id: string, patch: { name: string; kind: RoomKind }) {
      dispatch({ type: "updateSpace", id, patch: { ...patch, name: patch.name.trim() } });
    },
    deleteRoom(id: string) {
      dispatch({ type: "deleteSpace", id });
    },

    addItems(form: NewItemForm) {
      const template = form.templateKey ? (getItemTemplate(form.templateKey) ?? null) : null;
      const created = buildItems(
        {
          buildingId: building.id,
          spaceId: form.spaceId,
          name: form.name.trim(),
          template,
          count: form.count,
          installedOn: form.installedOn,
          hemisphere: building.hemisphere,
          today: data.today,
        },
        newId,
      );
      dispatch({ type: "addItems", ...created });
      return created.items[0]?.id;
    },
    updateItem(id: string, patch: Partial<Pick<Item, "name" | "spaceId" | "brand" | "model" | "installedOn" | "notes">>) {
      dispatch({ type: "updateItem", id, patch });
    },
    deleteItem(id: string) {
      dispatch({ type: "deleteItem", id });
    },

    addSchedule(item: Item, form: ScheduleForm) {
      const schedule = buildSchedule(item.id, { title: form.title.trim(), repeat: form.repeat }, startDate(item), building.hemisphere, newId);
      dispatch({ type: "addSchedule", schedule });
    },
    /** Changing how often a timer repeats recalculates its next due date. */
    updateSchedule(item: Item, schedule: Schedule, form: ScheduleForm) {
      const from = schedule.lastDoneOn ?? startDate(item);
      dispatch({
        type: "updateSchedule",
        id: schedule.id,
        patch: { title: form.title.trim(), repeat: form.repeat, nextDueOn: computeNextDue(form.repeat, from, building.hemisphere) },
      });
    },
    setSchedulePaused(id: string, paused: boolean) {
      dispatch({ type: "updateSchedule", id, patch: { active: !paused } });
    },
    deleteSchedule(id: string) {
      dispatch({ type: "deleteSchedule", id });
    },
  };
}

export type BuildingActions = ReturnType<typeof createBuildingActions>;
