"use client";

import { Check, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BuildingTypeIcon } from "@/components/building-type-icon";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { selectBuilding, useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { BUILDING_TYPE_INFO, formatAddressLine } from "@/lib/domain/building";

import { createSettingsActions } from "../actions";
import { BuildingForm } from "./building-form";
import { ThemePicker } from "./theme-picker";

export function SettingsView() {
  const current = useCurrentBuilding();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!current) return <SettingsSkeleton />;
  const { data, building } = current;
  const actions = createSettingsActions(data);

  return (
    <Page className="max-w-4xl">
      <PageHeader eyebrow="Account" title="Settings" />

      {building && (
        <Section title="This building" description={`Details for ${building.name}. Changes apply right away.`}>
          <BuildingForm key={building.id} building={building} onSave={(form) => actions.updateBuilding(building, form)} />
        </Section>
      )}

      <Section title="Your buildings" description="Switch buildings here or from the top of the sidebar.">
        {data.buildings.length === 0 && <EmptyState>No buildings yet.</EmptyState>}
        <ul className="flex flex-col divide-y rounded-lg border empty:hidden">
          {data.buildings.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                <BuildingTypeIcon type={b.type} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{b.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {BUILDING_TYPE_INFO[b.type].label} · {formatAddressLine(b.address)}, {b.address.city}
                </span>
              </span>
              {b.id === building?.id ? (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="size-3.5" aria-hidden="true" />
                  Current
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => selectBuilding(b.id)}>
                  Switch
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="self-start">
          <Link href="/onboarding">
            <Plus data-icon="inline-start" />
            Add a building
          </Link>
        </Button>
      </Section>

      <Section title="Appearance">
        <ThemePicker />
      </Section>

      <Section title="Account" description="Accounts arrive with the backend in phase 2.">
        <Button asChild variant="outline" className="self-start">
          <Link href="/login">
            <LogOut data-icon="inline-start" />
            Log out
          </Link>
        </Button>
      </Section>

      {building && (
        <Section title="Delete this building" description="Removes its rooms, items, timers, history, projects, and repairs. Contacts stay." danger>
          <Button variant="destructive" className="self-start" onClick={() => setConfirmDelete(true)}>
            Delete {building.name}
          </Button>
        </Section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${building?.name ?? "building"}?`}
        description="Its rooms, items, timers, history, projects, and repairs are deleted. This can't be undone."
        confirmLabel="Delete building"
        onConfirm={() => building && actions.deleteBuilding(building.id)}
      />
    </Page>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}

function Section({ title, description, danger, children }: SectionProps) {
  return (
    <section className={danger ? "flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-5" : "flex flex-col gap-3 surface p-5"}>
      <div className="flex flex-col gap-0.5">
        <h2 className={danger ? "text-base font-bold text-destructive" : "text-base font-bold"}>{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <Page className="max-w-4xl" aria-busy>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-96 rounded-xl" />
    </Page>
  );
}
