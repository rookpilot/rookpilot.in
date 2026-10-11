"use client";

import { Plus, X } from "lucide-react";

import { ContactAvatar } from "@/components/contact-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Contact } from "@/lib/domain/models";

interface ContactPickerProps {
  /** Everyone who can be tagged, already sorted. */
  contacts: Contact[];
  value: string[];
  onChange: (contactIds: string[]) => void;
  label?: string;
}

/** The "Helped by" field: tagged contacts as chips, plus a menu to tag more. */
export function ContactPicker({ contacts, value, onChange, label = "Helped by" }: ContactPickerProps) {
  const tagged = value.map((id) => contacts.find((c) => c.id === id)).filter((c): c is Contact => Boolean(c));
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">
        {label} <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {tagged.map((contact) => (
          <span key={contact.id} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-0.5 pr-1 pl-0.5 text-sm">
            <ContactAvatar contact={contact} size="sm" />
            {contact.name}
            <button
              type="button"
              className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Remove ${contact.name}`}
              onClick={() => toggle(contact.id, false)}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add people in the Contacts tab to tag them here.</p>
        ) : (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="rounded-full">
                <Plus data-icon="inline-start" />
                Tag contact
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 min-w-56">
              <DropdownMenuLabel>Who helped?</DropdownMenuLabel>
              {contacts.map((contact) => (
                <DropdownMenuCheckboxItem
                  key={contact.id}
                  checked={value.includes(contact.id)}
                  onCheckedChange={(on) => toggle(contact.id, on)}
                  onSelect={(event) => event.preventDefault()}
                >
                  <ContactAvatar contact={contact} size="sm" />
                  <span className="truncate">{contact.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </fieldset>
  );
}
