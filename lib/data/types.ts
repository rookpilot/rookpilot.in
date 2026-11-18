import type { Attachment, Building, Contact, ISODate, Item, LogEntry, Schedule, Space, Work } from "@/lib/domain/models";

/** Everything the signed-in person can see, loaded from Supabase. */
export interface AppData {
  buildings: Building[];
  spaces: Space[];
  items: Item[];
  schedules: Schedule[];
  logs: LogEntry[];
  work: Work[];
  contacts: Contact[];
  attachments: Attachment[];
  currentBuildingId: string | null;
  /** The date the data was loaded, used for due-date math. */
  today: ISODate;
}

/** A new item plus the timers created for it. */
export interface NewItems {
  items: Item[];
  schedules: Schedule[];
}
