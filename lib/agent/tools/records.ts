import type { Contact, Item, LogEntry, Schedule, Space, Work } from "@/lib/domain/models";
import type { ToolContext } from "./define";

// Finding records for the tools, and turning them into what Claude sees.

/** The current building's records. Contacts belong to the account, so they aren't split by building. */
export function inBuilding({ building, data }: ToolContext) {
  const items = data.items.filter((i) => i.buildingId === building.id);
  const itemIds = new Set(items.map((i) => i.id));
  return {
    rooms: data.spaces.filter((s) => s.buildingId === building.id),
    items,
    schedules: data.schedules.filter((s) => itemIds.has(s.itemId)),
    work: data.work.filter((w) => w.buildingId === building.id),
    logs: data.logs.filter((l) => l.buildingId === building.id),
  };
}

function find<T extends { id: string }>(list: T[], id: string, what: string, where = " in this building"): T {
  const found = list.find((record) => record.id === id);
  if (!found) throw new Error(`There's no ${what} with id ${id}${where}. Look it up with a list tool.`);
  return found;
}

// Each one throws if the id isn't in the current building, so Claude can't reach another building's records.
export const findRoom = (ctx: ToolContext, id: string) => find(inBuilding(ctx).rooms, id, "room");
export const findItem = (ctx: ToolContext, id: string) => find(inBuilding(ctx).items, id, "item");
export const findSchedule = (ctx: ToolContext, id: string) => find(inBuilding(ctx).schedules, id, "schedule");
export const findWork = (ctx: ToolContext, id: string) => find(inBuilding(ctx).work, id, "project or repair");
export const findContact = (ctx: ToolContext, id: string) => find(ctx.data.contacts, id, "contact", "");

export const newId = () => crypto.randomUUID();

/** Drops fields that weren't given, so a patch only changes what Claude set. */
export function given<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<T>;
}

/** Drops empty fields from what Claude sees, to keep tool results short. */
function compact<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null && value !== "" && value !== undefined)) as Partial<T>;
}

/** "3 projects or repairs", "1 item". */
export function count(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

// What Claude sees: snake_case like the tool inputs, with names next to ids so it doesn't need another lookup.

function names(ctx: ToolContext) {
  const rooms = new Map(ctx.data.spaces.map((s) => [s.id, s.name]));
  const items = new Map(ctx.data.items.map((i) => [i.id, i.name]));
  const contacts = new Map(ctx.data.contacts.map((c) => [c.id, c.name]));
  return {
    room: (id: string | null) => (id ? rooms.get(id) : undefined),
    item: (id: string | null) => (id ? items.get(id) : undefined),
    contacts: (ids: string[]) => (ids.length ? ids.map((id) => contacts.get(id) ?? id) : undefined),
  };
}

export function roomOut(ctx: ToolContext, room: Space) {
  const items = inBuilding(ctx).items.filter((i) => i.spaceId === room.id).length;
  return { id: room.id, name: room.name, kind: room.kind, items };
}

export function itemOut(ctx: ToolContext, item: Item) {
  return compact({
    id: item.id,
    name: item.name,
    room_id: item.spaceId,
    room: names(ctx).room(item.spaceId),
    brand: item.brand,
    model: item.model,
    installed_on: item.installedOn,
    notes: item.notes,
  });
}

export function scheduleOut(ctx: ToolContext, schedule: Schedule) {
  const item = ctx.data.items.find((i) => i.id === schedule.itemId);
  return compact({
    id: schedule.id,
    title: schedule.title,
    item_id: schedule.itemId,
    item: item?.name,
    room: names(ctx).room(item?.spaceId ?? null),
    repeat: schedule.repeat,
    last_done_on: schedule.lastDoneOn,
    next_due_on: schedule.nextDueOn,
    paused: !schedule.active || undefined,
  });
}

export function workOut(ctx: ToolContext, work: Work) {
  const name = names(ctx);
  return compact({
    id: work.id,
    kind: work.kind,
    title: work.title,
    status: work.status,
    room_id: work.spaceId,
    room: name.room(work.spaceId),
    item_id: work.itemId,
    item: name.item(work.itemId),
    performed_by: work.performedBy,
    budget: work.budget,
    cost: work.cost,
    started_on: work.startedOn,
    planned_on: work.plannedOn,
    finished_on: work.finishedOn,
    notes: work.notes,
    helped_by: name.contacts(work.contactIds),
  });
}

export function contactOut(contact: Contact) {
  return compact({
    id: contact.id,
    name: contact.name,
    company: contact.company,
    trade: contact.trade,
    phone: contact.phone,
    email: contact.email,
    instagram: contact.instagram,
    notes: contact.whyWeLikeThem,
  });
}

export function logOut(ctx: ToolContext, log: LogEntry) {
  const name = names(ctx);
  const item = ctx.data.items.find((i) => i.id === log.itemId);
  return compact({
    kind: "task",
    id: log.id,
    date: log.doneOn,
    title: log.title,
    item: item?.name,
    room: name.room(item?.spaceId ?? null),
    cost: log.cost,
    note: log.note,
    helped_by: name.contacts(log.contactIds),
  });
}
