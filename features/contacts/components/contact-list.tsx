"use client";

import { Search } from "lucide-react";

import { ContactAvatar } from "@/components/contact-avatar";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { describeContact } from "@/lib/domain/contact";
import type { Contact } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

interface ContactListProps {
  contacts: Contact[];
  query: string;
  onQueryChange: (query: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function matchesContact(contact: Contact, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [contact.name, contact.trade, contact.company, contact.instagram].some((field) => field.toLowerCase().includes(q));
}

export function ContactList({ contacts, query, onQueryChange, selectedId, onSelect }: ContactListProps) {
  const shown = contacts.filter((c) => matchesContact(c, query));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search contacts"
          placeholder="Search name or trade"
          className="h-9 pl-8"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState>{contacts.length === 0 ? "No contacts yet. Add the people who help with your buildings." : "No one matches that search."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((contact) => {
            const selected = contact.id === selectedId;
            return (
              <li key={contact.id}>
                <button
                  type="button"
                  onClick={() => onSelect(contact.id)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected && "border-border bg-card shadow-xs",
                  )}
                >
                  <ContactAvatar contact={contact} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[contact.trade, contact.instagram && `@${contact.instagram}`].filter(Boolean).join(" · ") || describeContact(contact) || "No details yet"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
