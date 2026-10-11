import { dispatch } from "@/lib/data/store";
import type { AppData } from "@/lib/data/types";
import type { Building } from "@/lib/domain/models";
import { computeNextDue } from "@/lib/scheduling";

export type BuildingForm = Omit<Building, "id">;

export function createSettingsActions(data: AppData) {
  return {
    /** Saves the building. Switching hemisphere moves every seasonal timer to the new season dates. */
    updateBuilding(building: Building, form: BuildingForm) {
      dispatch({
        type: "updateBuilding",
        id: building.id,
        patch: {
          ...form,
          name: form.name.trim(),
          address: Object.fromEntries(Object.entries(form.address).map(([key, value]) => [key, value.trim()])) as Building["address"],
        },
      });
      if (form.hemisphere === building.hemisphere) return;

      const items = new Map(data.items.filter((i) => i.buildingId === building.id).map((i) => [i.id, i]));
      for (const schedule of data.schedules) {
        const item = items.get(schedule.itemId);
        if (!item || schedule.repeat.kind !== "seasonal") continue;
        const from = schedule.lastDoneOn ?? item.installedOn ?? data.today;
        dispatch({ type: "updateSchedule", id: schedule.id, patch: { nextDueOn: computeNextDue(schedule.repeat, from, form.hemisphere) } });
      }
    },
    /** Deletes the building with its rooms, items, timers, history, projects, and repairs. */
    deleteBuilding(id: string) {
      dispatch({ type: "deleteBuilding", id });
    },
  };
}
