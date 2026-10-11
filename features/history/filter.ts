import { format } from "date-fns";

import { fromISODate } from "@/lib/dates";
import { historyContactIds, historyCost, type HistoryEntry } from "@/lib/data/selectors";
import type { HistoryKind } from "@/lib/domain/history";

export interface HistoryFilter {
  kind: HistoryKind | "all";
  /** A room id, or "" for every room. */
  spaceId: string;
  /** A contact id, or "" for anyone. */
  contactId: string;
}

export const NO_FILTER: HistoryFilter = { kind: "all", spaceId: "", contactId: "" };

export function filterHistory(entries: HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  return entries.filter(
    (entry) =>
      (filter.kind === "all" || entry.kind === filter.kind) &&
      (!filter.spaceId || entry.space?.id === filter.spaceId) &&
      (!filter.contactId || historyContactIds(entry).includes(filter.contactId)),
  );
}

export interface HistoryMonth {
  /** "October 2026" */
  label: string;
  entries: HistoryEntry[];
}

/** Splits entries (already newest first) into months. */
export function groupByMonth(entries: HistoryEntry[]): HistoryMonth[] {
  const months: HistoryMonth[] = [];
  for (const entry of entries) {
    const label = format(fromISODate(entry.date), "MMMM yyyy");
    const last = months.at(-1);
    if (last?.label === label) last.entries.push(entry);
    else months.push({ label, entries: [entry] });
  }
  return months;
}

export function totalCost(entries: HistoryEntry[]): number {
  return entries.reduce((sum, entry) => sum + (historyCost(entry) ?? 0), 0);
}
