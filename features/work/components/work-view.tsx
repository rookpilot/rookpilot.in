"use client";

import { ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { NoBuilding } from "@/components/no-building";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { useSelectedId } from "@/hooks/use-selected-id";
import { selectContacts, selectSpaces, selectWork } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building, Contact, WorkKind, WorkStatus } from "@/lib/domain/models";
import { WORK_KIND_INFO, WORK_STATUS_LABELS } from "@/lib/domain/work";
import { cn } from "@/lib/utils";

import { createWorkActions } from "../actions";
import { WorkDetail } from "./work-detail";
import { WorkDialog } from "./work-dialog";
import { WorkList } from "./work-list";

const DESCRIPTIONS: Record<WorkKind, string> = {
  project: "Things you're adding or improving. DIY or hired.",
  repair: "Things that broke, tracked until they're fixed.",
};

/** The Projects or Repairs tab. Both use the same list, detail, and form. */
export function WorkView({ kind }: { kind: WorkKind }) {
  const current = useCurrentBuilding();
  if (!current) return <WorkSkeleton />;
  if (!current.building) return <NoBuilding />;
  return <WorkPage kind={kind} data={current.data} building={current.building} />;
}

type DialogState = "add" | "edit" | "delete" | null;
type Filter = WorkStatus | "all";

function WorkPage({ kind, data, building }: { kind: WorkKind; data: AppData; building: Building }) {
  const info = WORK_KIND_INFO[kind];
  const actions = createWorkActions(data, building, kind);
  const { selectedId, select, clear } = useSelectedId();
  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = (open: boolean) => !open && setDialog(null);

  const all = selectWork(data, building.id, kind);
  const rooms = selectSpaces(data, building.id);
  const spaces = new Map(rooms.map((s) => [s.id, s]));
  const contacts = selectContacts(data);
  const contactsById = new Map(contacts.map((c) => [c.id, c]));
  const shownList = filter === "all" ? all : all.filter((w) => w.status === filter);

  const selected = all.find((w) => w.id === selectedId) ?? null;
  const shown = selected ?? shownList[0] ?? null;

  return (
    <Page className="max-w-6xl">
      <PageHeader
        title={info.plural}
        description={DESCRIPTIONS[kind]}
        actions={
          <Button onClick={() => setDialog("add")}>
            <Plus data-icon="inline-start" />
            Add {info.label.toLowerCase()}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn("flex-col gap-3", selected ? "hidden lg:flex" : "flex")}>
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            value={filter}
            onValueChange={(value) => value && setFilter(value as Filter)}
            aria-label="Filter by status"
            className="flex-wrap"
          >
            {(["all", ...info.statuses] as const).map((status) => (
              <ToggleGroupItem key={status} value={status} className="rounded-full px-3 data-[state=on]:bg-primary-soft data-[state=on]:text-primary">
                {status === "all" ? "All" : WORK_STATUS_LABELS[status]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <WorkList
            kind={kind}
            work={shownList}
            total={all.length}
            spaces={spaces}
            selectedId={shown?.id ?? null}
            today={data.today}
            onSelect={select}
          />
        </div>
        <div className={cn("min-w-0 flex-col gap-3", selected ? "flex" : "hidden lg:flex")}>
          {selected && (
            <Button variant="ghost" size="sm" className="self-start text-muted-foreground lg:hidden" onClick={clear}>
              <ChevronLeft data-icon="inline-start" />
              {info.plural}
            </Button>
          )}
          {shown ? (
            <WorkDetail
              work={shown}
              space={shown.spaceId ? (spaces.get(shown.spaceId) ?? null) : null}
              item={shown.itemId ? (data.items.find((i) => i.id === shown.itemId) ?? null) : null}
              contacts={shown.contactIds.map((id) => contactsById.get(id)).filter((c): c is Contact => Boolean(c))}
              today={data.today}
              onStatusChange={(status) => actions.setStatus(shown, status)}
              onEdit={() => setDialog("edit")}
              onDelete={() => setDialog("delete")}
            />
          ) : (
            <EmptyState>Pick one to see its details.</EmptyState>
          )}
        </div>
      </div>

      <WorkDialog
        open={dialog === "add" || dialog === "edit"}
        onOpenChange={close}
        kind={kind}
        work={dialog === "edit" ? (shown ?? undefined) : undefined}
        rooms={rooms}
        items={data.items.filter((i) => i.buildingId === building.id)}
        contacts={contacts}
        today={data.today}
        onSave={(form) => {
          if (dialog === "edit" && shown) actions.update(shown, form);
          else {
            setFilter("all");
            select(actions.add(form));
          }
        }}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={close}
        title={`Delete "${shown?.title ?? ""}"?`}
        description={`This removes the ${info.label.toLowerCase()} from the list, the calendar, and History.`}
        confirmLabel={`Delete ${info.label.toLowerCase()}`}
        onConfirm={() => {
          if (!shown) return;
          actions.remove(shown.id);
          clear();
        }}
      />
    </Page>
  );
}

export function WorkSkeleton() {
  return (
    <Page className="max-w-6xl" aria-busy>
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
      </div>
    </Page>
  );
}
