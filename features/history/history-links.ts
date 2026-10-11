import { itemHref } from "@/features/building/routes";
import type { HistoryEntry } from "@/lib/data/selectors";
import { workHref } from "@/lib/domain/work";

/** Where clicking a History entry goes: the item in the Building tab, or the project or repair. */
export function historyHref(entry: HistoryEntry): string | null {
  if (entry.kind !== "task") return workHref(entry.kind, entry.work.id);
  return entry.item ? itemHref(entry.item.spaceId, entry.item.id) : null;
}

export function historyBuildingId(entry: HistoryEntry): string {
  return entry.kind === "task" ? entry.log.buildingId : entry.work.buildingId;
}
