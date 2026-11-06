import type { Attachment, Building, Contact, Item, LogEntry, Schedule, Space, Work } from "@/lib/domain/models";
import type { RepeatRule } from "@/lib/domain/schedule";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

/*
 * Translates between database rows (snake_case, flat address) and the app's types.
 * Kept pure so it can be tested without a database.
 */

type Row<T extends keyof RowTables> = RowTables[T];
interface RowTables {
  buildings: Tables<"buildings">;
  spaces: Tables<"spaces">;
  items: Tables<"items">;
  schedules: Tables<"schedules">;
  log_entries: Tables<"log_entries"> & { log_entry_contacts: { contact_id: string }[] };
  work: Tables<"work"> & { work_contacts: { contact_id: string }[] };
  contacts: Tables<"contacts">;
  attachments: Tables<"attachments">;
}

// Database → app

export function buildingFromRow(row: Row<"buildings">): Building {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: {
      line1: row.address_line1,
      line2: row.address_line2,
      city: row.city,
      region: row.region,
      postalCode: row.postal_code,
      country: row.country,
    },
    beds: row.beds,
    baths: row.baths,
    yearBuilt: row.year_built,
    sqft: row.sqft,
    hemisphere: row.hemisphere,
  };
}

export function spaceFromRow(row: Row<"spaces">): Space {
  return { id: row.id, buildingId: row.building_id, name: row.name, kind: row.kind };
}

export function itemFromRow(row: Row<"items">): Item {
  return {
    id: row.id,
    buildingId: row.building_id,
    spaceId: row.space_id,
    name: row.name,
    templateKey: row.template_key,
    brand: row.brand,
    model: row.model,
    installedOn: row.installed_on,
    notes: row.notes,
  };
}

export function scheduleFromRow(row: Row<"schedules">): Schedule {
  return {
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    // The database checks the shape when the row is saved.
    repeat: row.repeat as unknown as RepeatRule,
    lastDoneOn: row.last_done_on,
    nextDueOn: row.next_due_on,
    active: row.active,
  };
}

export function logFromRow(row: Row<"log_entries">): LogEntry {
  return {
    id: row.id,
    buildingId: row.building_id,
    itemId: row.item_id,
    scheduleId: row.schedule_id,
    title: row.title,
    doneOn: row.done_on,
    note: row.note,
    cost: row.cost,
    contactIds: row.log_entry_contacts.map((tag) => tag.contact_id),
  };
}

export function workFromRow(row: Row<"work">): Work {
  return {
    id: row.id,
    buildingId: row.building_id,
    kind: row.kind,
    title: row.title,
    // The database only allows statuses that match the kind.
    status: row.status as Work["status"],
    spaceId: row.space_id,
    itemId: row.item_id,
    performedBy: row.performed_by,
    cost: row.cost,
    budget: row.budget,
    startedOn: row.started_on,
    plannedOn: row.planned_on,
    finishedOn: row.finished_on,
    notes: row.notes,
    contactIds: row.work_contacts.map((tag) => tag.contact_id),
  };
}

export function contactFromRow(row: Row<"contacts">): Contact {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    trade: row.trade,
    phone: row.phone,
    email: row.email,
    instagram: row.instagram,
    photoPath: row.photo_path,
    whyWeLikeThem: row.why_we_like_them,
  };
}

// App → database. Each takes a full object or a patch and returns only the columns it has.

const defined = <T extends object>(row: T): T =>
  Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;

export function buildingToRow(building: Partial<Building>): TablesInsert<"buildings"> {
  const a = building.address;
  return defined({
    id: building.id,
    name: building.name,
    type: building.type,
    address_line1: a?.line1,
    address_line2: a?.line2,
    city: a?.city,
    region: a?.region,
    postal_code: a?.postalCode,
    country: a?.country,
    beds: building.beds,
    baths: building.baths,
    year_built: building.yearBuilt,
    sqft: building.sqft,
    hemisphere: building.hemisphere,
  }) as TablesInsert<"buildings">;
}

export function spaceToRow(space: Partial<Space>, sortOrder?: number): TablesInsert<"spaces"> {
  return defined({ id: space.id, building_id: space.buildingId, name: space.name, kind: space.kind, sort_order: sortOrder }) as TablesInsert<"spaces">;
}

export function itemToRow(item: Partial<Item>): TablesInsert<"items"> {
  return defined({
    id: item.id,
    building_id: item.buildingId,
    space_id: item.spaceId,
    name: item.name,
    template_key: item.templateKey,
    brand: item.brand,
    model: item.model,
    installed_on: item.installedOn,
    notes: item.notes,
  }) as TablesInsert<"items">;
}

/** Timers don't carry their building in the app, so the caller passes it. */
export function scheduleToRow(schedule: Partial<Schedule>, buildingId?: string): TablesInsert<"schedules"> {
  return defined({
    id: schedule.id,
    building_id: buildingId,
    item_id: schedule.itemId,
    title: schedule.title,
    repeat: schedule.repeat as TablesInsert<"schedules">["repeat"] | undefined,
    last_done_on: schedule.lastDoneOn,
    next_due_on: schedule.nextDueOn,
    active: schedule.active,
  }) as TablesInsert<"schedules">;
}

/** Tags are saved separately, so contactIds is left out. */
export function logToRow(log: LogEntry): TablesInsert<"log_entries"> {
  return {
    id: log.id,
    building_id: log.buildingId,
    item_id: log.itemId,
    schedule_id: log.scheduleId,
    title: log.title,
    done_on: log.doneOn,
    note: log.note,
    cost: log.cost,
  };
}

/** Tags are saved separately, so contactIds is left out. */
export function workToRow(work: Partial<Work>): TablesInsert<"work"> {
  return defined({
    id: work.id,
    building_id: work.buildingId,
    kind: work.kind,
    title: work.title,
    status: work.status,
    space_id: work.spaceId,
    item_id: work.itemId,
    performed_by: work.performedBy,
    cost: work.cost,
    budget: work.budget,
    started_on: work.startedOn,
    planned_on: work.plannedOn,
    finished_on: work.finishedOn,
    notes: work.notes,
  }) as TablesInsert<"work">;
}

export function contactToRow(contact: Partial<Contact>): TablesInsert<"contacts"> {
  return defined({
    id: contact.id,
    name: contact.name,
    company: contact.company,
    trade: contact.trade,
    phone: contact.phone,
    email: contact.email,
    instagram: contact.instagram,
    photo_path: contact.photoPath,
    why_we_like_them: contact.whyWeLikeThem,
  }) as TablesInsert<"contacts">;
}

export function attachmentFromRow(row: Row<"attachments">): Attachment {
  return {
    id: row.id,
    buildingId: row.building_id,
    itemId: row.item_id,
    workId: row.work_id,
    logEntryId: row.log_entry_id,
    kind: row.kind,
    storagePath: row.storage_path,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
  };
}

export function attachmentToRow(attachment: Partial<Attachment>): TablesInsert<"attachments"> {
  return defined({
    id: attachment.id,
    building_id: attachment.buildingId,
    item_id: attachment.itemId,
    work_id: attachment.workId,
    log_entry_id: attachment.logEntryId,
    kind: attachment.kind,
    storage_path: attachment.storagePath,
    file_name: attachment.fileName,
    content_type: attachment.contentType,
    size_bytes: attachment.sizeBytes,
  }) as TablesInsert<"attachments">;
}
