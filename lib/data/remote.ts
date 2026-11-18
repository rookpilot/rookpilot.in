import type { SupabaseClient } from "@supabase/supabase-js";

import type { ISODate } from "@/lib/domain/models";
import type { Database, Json } from "@/lib/supabase/database.types";

import { removeFiles } from "./files";
import { attachmentsRemovedBy, type DataAction } from "./reducer";
import {
  attachmentFromRow,
  attachmentToRow,
  buildingFromRow,
  buildingToRow,
  contactFromRow,
  contactToRow,
  itemFromRow,
  itemToRow,
  logFromRow,
  logToRow,
  scheduleFromRow,
  scheduleToRow,
  spaceFromRow,
  spaceToRow,
  workFromRow,
  workToRow,
} from "./rows";
import type { AppData } from "./types";

type Client = SupabaseClient<Database>;

/** The API returns at most this many rows per request, so longer lists are read in pages. */
const PAGE_SIZE = 1000;

async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Everything the signed-in person can see. The access rules decide which rows those are. */
export async function loadAppData(supabase: Client, today: ISODate): Promise<Omit<AppData, "currentBuildingId">> {
  const [buildings, spaces, items, schedules, logs, work, contacts, attachments] = await Promise.all([
    readAll((from, to) => supabase.from("buildings").select("*").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("spaces").select("*").order("sort_order").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("items").select("*").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("schedules").select("*").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("log_entries").select("*, log_entry_contacts(contact_id)").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("work").select("*, work_contacts(contact_id)").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("contacts").select("*").order("created_at").order("id").range(from, to)),
    readAll((from, to) => supabase.from("attachments").select("*").order("created_at").order("id").range(from, to)),
  ]);
  return {
    buildings: buildings.map(buildingFromRow),
    spaces: spaces.map(spaceFromRow),
    items: items.map(itemFromRow),
    schedules: schedules.map(scheduleFromRow),
    logs: logs.map(logFromRow),
    work: work.map(workFromRow),
    contacts: contacts.map(contactFromRow),
    attachments: attachments.map(attachmentFromRow),
    today,
  };
}

const json = (value: unknown) => value as Json;

async function run(request: PromiseLike<{ error: unknown }>) {
  const { error } = await request;
  if (error) throw error;
}

/**
 * Saves one change. `before` is the data as it was just before the change, used to look
 * things up that the change itself doesn't carry (like which building a timer is in).
 * Deletes rely on the database to remove or unlink what depended on the deleted row.
 */
export async function persist(supabase: Client, action: DataAction, before: AppData): Promise<void> {
  await saveRows(supabase, action, before);
  await removeLeftoverFiles(supabase, action, before);
}

/** After a delete or a photo change is saved, removes the stored files nothing points at anymore. */
async function removeLeftoverFiles(supabase: Client, action: DataAction, before: AppData) {
  await removeFiles(supabase, "attachments", attachmentsRemovedBy(before, action).map((a) => a.storagePath));

  const oldPhoto = (id: string) => before.contacts.find((c) => c.id === id)?.photoPath ?? null;
  if (action.type === "deleteContact") {
    const path = oldPhoto(action.id);
    if (path) await removeFiles(supabase, "contact-photos", [path]);
  }
  if (action.type === "updateContact" && action.patch.photoPath !== undefined) {
    const path = oldPhoto(action.id);
    if (path && path !== action.patch.photoPath) await removeFiles(supabase, "contact-photos", [path]);
  }
}

async function saveRows(supabase: Client, action: DataAction, before: AppData): Promise<void> {
  const buildingOfItem = (itemId: string) => before.items.find((i) => i.id === itemId)?.buildingId;

  switch (action.type) {
    case "selectBuilding":
      return;

    case "addBuilding":
      return run(
        supabase.rpc("create_building", {
          building: json(buildingToRow(action.building)),
          spaces: json(action.spaces.map((space, index) => spaceToRow(space, index))),
          items: json(action.items.map(itemToRow)),
          schedules: json(action.schedules.map((s) => scheduleToRow(s, action.building.id))),
        }),
      );
    case "updateBuilding":
      return run(supabase.from("buildings").update(buildingToRow(action.patch)).eq("id", action.id));
    case "deleteBuilding":
      return run(supabase.from("buildings").delete().eq("id", action.id));

    case "addSpace": {
      // New rooms go to the end of the building's list.
      const sortOrder = before.spaces.filter((s) => s.buildingId === action.space.buildingId).length;
      return run(supabase.from("spaces").insert(spaceToRow(action.space, sortOrder)));
    }
    case "updateSpace":
      return run(supabase.from("spaces").update(spaceToRow(action.patch)).eq("id", action.id));
    case "deleteSpace":
      return run(supabase.from("spaces").delete().eq("id", action.id));

    case "addItems": {
      const buildings = new Map(action.items.map((item) => [item.id, item.buildingId]));
      return run(
        supabase.rpc("add_items", {
          items: json(action.items.map(itemToRow)),
          schedules: json(action.schedules.map((s) => scheduleToRow(s, buildings.get(s.itemId)))),
        }),
      );
    }
    case "updateItem":
      await run(supabase.from("items").update(itemToRow(action.patch)).eq("id", action.id));
      // Work linked to the item follows it to its new room.
      if (action.patch.spaceId) {
        await run(supabase.from("work").update({ space_id: action.patch.spaceId }).eq("item_id", action.id));
      }
      return;
    case "deleteItem":
      return run(supabase.from("items").delete().eq("id", action.id));

    case "addSchedule":
      return run(supabase.from("schedules").insert(scheduleToRow(action.schedule, buildingOfItem(action.schedule.itemId))));
    case "updateSchedule":
      return run(supabase.from("schedules").update(scheduleToRow(action.patch)).eq("id", action.id));
    case "deleteSchedule":
      return run(supabase.from("schedules").delete().eq("id", action.id));

    case "completeSchedules":
      return run(
        supabase.rpc("complete_schedules", {
          completions: json(
            action.completions.map((c) => ({
              log: logToRow(c.log),
              contact_ids: c.log.contactIds,
              last_done_on: c.lastDoneOn,
              next_due_on: c.nextDueOn,
            })),
          ),
        }),
      );
    case "deleteLog":
      return run(supabase.from("log_entries").delete().eq("id", action.id));

    case "addContact":
      return run(supabase.from("contacts").insert(contactToRow(action.contact)));
    case "updateContact":
      return run(supabase.from("contacts").update(contactToRow(action.patch)).eq("id", action.id));
    case "deleteContact":
      return run(supabase.from("contacts").delete().eq("id", action.id));

    case "addWork":
      return run(supabase.rpc("save_work", { work: json(workToRow(action.work)), contact_ids: action.work.contactIds }));
    case "updateWork": {
      // A change to the "Helped by" tags saves the whole entry with its tags in one step.
      if (action.patch.contactIds) {
        const current = before.work.find((w) => w.id === action.id);
        if (!current) throw new Error(`Work ${action.id} not found`);
        const next = { ...current, ...action.patch };
        return run(supabase.rpc("save_work", { work: json(workToRow(next)), contact_ids: next.contactIds }));
      }
      return run(supabase.from("work").update(workToRow(action.patch)).eq("id", action.id));
    }
    case "deleteWork":
      return run(supabase.from("work").delete().eq("id", action.id));

    case "addAttachment":
      return run(supabase.from("attachments").insert(attachmentToRow(action.attachment)));
    case "updateAttachment":
      return run(supabase.from("attachments").update(attachmentToRow(action.patch)).eq("id", action.id));
    case "deleteAttachment":
      return run(supabase.from("attachments").delete().eq("id", action.id));
  }
}
