import type { PendingChange } from "@/lib/agent/nodes/humanReview";
import type { AppData } from "@/lib/data/types";
import { formatShortDate } from "@/lib/dates";
import { ROOM_KIND_LABELS, type RoomKind } from "@/lib/domain/room";
import { formatRepeat, type RepeatRule } from "@/lib/domain/schedule";
import type { WorkStatus } from "@/lib/domain/models";
import { WORK_STATUS_LABELS } from "@/lib/domain/work";

// Turns a change Claude wants to make into what the confirm card shows: a title, and one
// row per field with names instead of ids ("Room: Backyard", not a uuid).

export type Field = {
  key: string;
  label: string;
  /** What the card shows. */
  text: string;
  /** How the person can change it on the card, if they can. Ids, lists and choices can't be edited here. */
  edit?: "text" | "number" | "date";
  /** The raw value, for the edit input. */
  value: unknown;
};

export type ChangeView = { title: string; record?: string; fields: Field[] };

const TITLES: Record<string, string | ((input: Record<string, unknown>) => string)> = {
  create_work: (input) => (input.kind === "repair" ? "New repair" : "New project"),
  update_work: "Change project or repair",
  delete_work: "Delete project or repair",
  create_schedule: "New schedule",
  update_schedule: "Change schedule",
  complete_schedule: "Mark done",
  delete_schedule: "Delete schedule",
  create_contact: "New contact",
  update_contact: "Change contact",
  delete_contact: "Delete contact",
  create_room: "New room",
  update_room: "Change room",
  delete_room: "Delete room",
  create_item: "New item",
  update_item: "Change item",
  delete_item: "Delete item",
};

const LABELS: Record<string, string> = {
  room_id: "Room",
  item_id: "Item",
  performed_by: "Done by",
  planned_on: "Planned",
  finished_on: "Finished",
  installed_on: "Installed",
  next_due_on: "Next due",
  done_on: "Done on",
  contact_ids: "Helped by",
  active: "Active",
};

/** Fields that are choices from a list. Shown nicely, but not editable on the card. */
const CHOICES = new Set(["kind", "status", "performed_by", "active"]);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const label = (key: string) => LABELS[key] ?? capitalize(key.replaceAll("_", " "));

/** The name of the record an update or delete is about, found by its id. */
function recordName(tool: string, id: unknown, data: AppData | null): string | undefined {
  if (typeof id !== "string" || !data) return undefined;
  const table = tool.split("_").slice(1).join("_");
  const lists: Record<string, { id: string; name?: string; title?: string }[]> = {
    work: data.work,
    schedule: data.schedules,
    contact: data.contacts,
    room: data.spaces,
    item: data.items,
  };
  const found = lists[table]?.find((record) => record.id === id);
  return found?.name ?? found?.title;
}

function show(key: string, value: unknown, data: AppData | null): string {
  if (key === "room_id") return data?.spaces.find((s) => s.id === value)?.name ?? "Unknown room";
  if (key === "item_id") return data?.items.find((i) => i.id === value)?.name ?? "Unknown item";
  if (key === "contact_ids" && Array.isArray(value)) {
    return value.map((id) => data?.contacts.find((c) => c.id === id)?.name ?? "Unknown contact").join(", ");
  }
  if (key === "repeat") return formatRepeat(value as RepeatRule);
  if (key === "status") return WORK_STATUS_LABELS[value as WorkStatus] ?? String(value);
  if (key === "performed_by") return value === "hired" ? "Hired" : "DIY";
  if (key === "kind" && typeof value === "string") return ROOM_KIND_LABELS[value as RoomKind] ?? capitalize(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && ["budget", "cost"].includes(key)) return `$${value.toLocaleString()}`;
  if (typeof value === "string" && key.endsWith("_on")) return formatShortDate(value, data?.today);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function editAs(key: string, value: unknown): Field["edit"] {
  if (key === "id" || key.endsWith("_id") || key.endsWith("_ids") || CHOICES.has(key)) return undefined;
  if (typeof value === "number") return "number";
  if (typeof value === "string") return key.endsWith("_on") ? "date" : "text";
  return undefined;
}

export function describeChange(change: PendingChange, data: AppData | null): ChangeView {
  const title = TITLES[change.tool];
  const { id, ...rest } = change.input;
  return {
    title: typeof title === "function" ? title(change.input) : (title ?? change.tool),
    record: id === undefined ? undefined : (recordName(change.tool, id, data) ?? "Unknown record"),
    fields: Object.entries(rest).map(([key, value]) => ({ key, label: label(key), text: show(key, value, data), edit: editAs(key, value), value })),
  };
}
