"use client";

import { ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedId } from "@/hooks/use-selected-id";
import { selectContacts } from "@/lib/data/selectors";
import { useAppData } from "@/lib/data/store";
import type { AppData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

import { contactActions } from "../actions";
import { ContactDetail } from "./contact-detail";
import { ContactDialog } from "./contact-dialog";
import { ContactList } from "./contact-list";

export function ContactsView() {
  const data = useAppData();
  if (!data) return <ContactsSkeleton />;
  return <Contacts data={data} />;
}

type DialogState = "add" | "edit" | "delete" | null;

function Contacts({ data }: { data: AppData }) {
  const contacts = selectContacts(data);
  const { selectedId, select, clear } = useSelectedId();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = (open: boolean) => !open && setDialog(null);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  // Wide screens always show someone; phones show the list until a contact is picked.
  const shown = selected ?? contacts[0] ?? null;

  return (
    <Page className="max-w-6xl">
      <PageHeader
        eyebrow="Account"
        title="Contacts"
        description="The people who help keep your buildings running."
        actions={
          <Button onClick={() => setDialog("add")}>
            <Plus data-icon="inline-start" />
            Add contact
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className={cn(selected ? "hidden lg:block" : "block")}>
          <ContactList contacts={contacts} query={query} onQueryChange={setQuery} selectedId={shown?.id ?? null} onSelect={select} />
        </div>
        <div className={cn("min-w-0 flex-col gap-3", selected ? "flex" : "hidden lg:flex")}>
          {selected && (
            <Button variant="ghost" size="sm" className="self-start text-muted-foreground lg:hidden" onClick={clear}>
              <ChevronLeft data-icon="inline-start" />
              Contacts
            </Button>
          )}
          {shown ? (
            <ContactDetail contact={shown} data={data} onEdit={() => setDialog("edit")} onDelete={() => setDialog("delete")} />
          ) : (
            <EmptyState>Add someone, like the plumber who fixed your sink or a friend who lends tools.</EmptyState>
          )}
        </div>
      </div>

      <ContactDialog
        open={dialog === "add" || dialog === "edit"}
        onOpenChange={close}
        contact={dialog === "edit" ? (shown ?? undefined) : undefined}
        onSave={(form) => {
          if (dialog === "edit" && shown) contactActions.update(shown.id, form);
          else select(contactActions.add(form));
        }}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={close}
        title={`Delete ${shown?.name ?? "contact"}?`}
        description="Their tags are removed from past tasks, repairs, and projects. The work itself stays."
        confirmLabel="Delete contact"
        onConfirm={() => {
          if (!shown) return;
          contactActions.remove(shown.id);
          clear();
        }}
      />
    </Page>
  );
}

export function ContactsSkeleton() {
  return (
    <Page className="max-w-6xl" aria-busy>
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="hidden h-96 rounded-xl lg:block" />
      </div>
    </Page>
  );
}
