"use client";

import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { SelectField } from "@/components/form/select-field";
import { HistoryList } from "@/components/history-list";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { NoBuilding } from "@/components/no-building";
import { FilterChips } from "@/components/segmented-control";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { selectContacts, selectContactsById, selectHistory, selectSpaces } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { HistoryKind } from "@/lib/domain/history";
import type { Building } from "@/lib/domain/models";
import { formatMoney } from "@/lib/money";

import { filterHistory, groupByMonth, NO_FILTER, totalCost, type HistoryFilter } from "../filter";
import { historyHref } from "../history-links";

const KINDS: (HistoryKind | "all")[] = ["all", "task", "repair", "project"];
const KIND_FILTER_LABELS: Record<HistoryKind | "all", string> = { all: "All", task: "Tasks", repair: "Repairs", project: "Projects" };

export function HistoryView() {
  const current = useCurrentBuilding();
  if (!current) return <HistorySkeleton />;
  if (!current.building) return <NoBuilding />;
  return <History data={current.data} building={current.building} />;
}

function History({ data, building }: { data: AppData; building: Building }) {
  const [filter, setFilter] = useState<HistoryFilter>(NO_FILTER);
  const set = (patch: Partial<HistoryFilter>) => setFilter((prev) => ({ ...prev, ...patch }));

  const all = selectHistory(data, building.id);
  const entries = filterHistory(all, filter);
  const spent = totalCost(entries);
  const filtered = filter.kind !== "all" || filter.spaceId !== "" || filter.contactId !== "";

  return (
    <Page>
      <PageHeader eyebrow={building.name} title="History" description="Everything finished in this building, newest first: tasks, repairs, and projects." />

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-end">
        <FilterChips
          label="Type"
          value={filter.kind}
          options={KINDS.map((kind) => ({ value: kind, label: KIND_FILTER_LABELS[kind] }))}
          onChange={(kind) => set({ kind })}
          className="sm:mb-1"
        />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <SelectField label="Room" value={filter.spaceId} onChange={(e) => set({ spaceId: e.target.value })}>
            <option value="">All rooms</option>
            {selectSpaces(data, building.id).map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Contact" value={filter.contactId} onChange={(e) => set({ contactId: e.target.value })}>
            <option value="">Anyone</option>
            {selectContacts(data).map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
        {spent > 0 && ` · ${formatMoney(spent)} spent`}
        {filtered && (
          <>
            {" · "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setFilter(NO_FILTER)}>
              Clear filters
            </Button>
          </>
        )}
      </p>

      {entries.length === 0 ? (
        <EmptyState>
          {all.length === 0
            ? "Nothing finished yet. Mark a task done, or finish a project or repair, and it shows up here."
            : "Nothing matches these filters."}
        </EmptyState>
      ) : (
        groupByMonth(entries).map((month) => (
          <section key={month.label} className="flex flex-col gap-2" aria-label={month.label}>
            <h2 className="group-label">{month.label}</h2>
            <HistoryList
              entries={month.entries}
              today={data.today}
              contactsById={selectContactsById(data)}
              href={historyHref}
              inMonthGroups
            />
          </section>
        ))
      )}
    </Page>
  );
}

function HistorySkeleton() {
  return (
    <Page aria-busy>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </Page>
  );
}

