"use client";

import { AtSign, Mail, Pencil, Phone, Trash2, type LucideIcon } from "lucide-react";

import { ContactAvatar } from "@/components/contact-avatar";
import { EmptyState } from "@/components/empty-state";
import { HistoryList } from "@/components/history-list";
import { Button } from "@/components/ui/button";
import { historyBuildingId, historyHref } from "@/features/history/history-links";
import { selectBuilding } from "@/features/shell/hooks/use-current-building";
import { selectContactHistory, selectContactsById } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import { describeContact, instagramUrl } from "@/lib/domain/contact";
import type { Contact } from "@/lib/domain/models";

interface Channel {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}

interface ContactDetailProps {
  contact: Contact;
  data: AppData;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactDetail({ contact, data, onEdit, onDelete }: ContactDetailProps) {
  const history = selectContactHistory(data, contact.id);
  const buildings = new Map(data.buildings.map((b) => [b.id, b.name]));
  const manyBuildings = data.buildings.length > 1;

  const channels: Channel[] = [];
  if (contact.phone) channels.push({ icon: Phone, label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` });
  if (contact.email) channels.push({ icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` });
  if (contact.instagram) {
    channels.push({ icon: AtSign, label: "Instagram", value: `@${contact.instagram}`, href: instagramUrl(contact.instagram), external: true });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ContactAvatar contact={contact} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{contact.name}</h2>
          {describeContact(contact) && <p className="truncate text-sm text-muted-foreground">{describeContact(contact)}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${contact.name}`} onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${contact.name}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      {channels.length > 0 && (
        <dl className="flex flex-col divide-y overflow-hidden surface">
          {channels.map((channel) => (
            <div key={channel.label} className="flex items-center gap-3 px-4 py-2.5">
              <channel.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <dt className="w-20 text-xs text-muted-foreground">{channel.label}</dt>
              <dd className="min-w-0 flex-1 truncate text-sm">
                <a
                  href={channel.href}
                  className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                  {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {channel.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <section className="flex flex-col gap-1.5" aria-labelledby="why-heading">
        <h3 id="why-heading" className="text-sm font-bold">
          Why we like them
        </h3>
        {contact.whyWeLikeThem ? (
          <p className="text-sm whitespace-pre-line text-muted-foreground">{contact.whyWeLikeThem}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nothing written yet.</p>
        )}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="helped-heading">
        <h3 id="helped-heading" className="text-sm font-bold">
          Helped with
        </h3>
        {history.length === 0 ? (
          <EmptyState>Tag {contact.name} when you mark a task done or add a project or repair, and it shows up here.</EmptyState>
        ) : (
          <HistoryList
            entries={history}
            today={data.today}
            contactsById={selectContactsById(data)}
            showContacts={false}
            describe={(entry) => (manyBuildings ? (buildings.get(historyBuildingId(entry)) ?? "") : "")}
            href={historyHref}
            onFollow={(entry) => selectBuilding(historyBuildingId(entry))}
          />
        )}
      </section>
    </div>
  );
}
