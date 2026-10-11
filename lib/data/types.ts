import type { Building, ISODate, Item, Schedule, Space } from "@/lib/domain/models";

/** Everything the app knows. In phase 2 this moves behind the API. */
export interface AppData {
  buildings: Building[];
  spaces: Space[];
  items: Item[];
  schedules: Schedule[];
  currentBuildingId: string | null;
  /** The date the data was loaded, used for due-date math. */
  today: ISODate;
}

/** A new item plus the timers created for it. */
export interface NewItems {
  items: Item[];
  schedules: Schedule[];
}
