"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { ContactAvatar } from "@/components/contact-avatar";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/form/native-select";
import { itemHref, roomHref } from "@/features/building/routes";
import { contactHref } from "@/features/contacts/routes";
import { formatShortDate } from "@/lib/dates";
import type { Contact, ISODate, Item, Space, Work, WorkStatus } from "@/lib/domain/models";
import { isFinished, WORK_KIND_INFO, WORK_STATUS_LABELS } from "@/lib/domain/work";
import { formatMoney } from "@/lib/money";

interface WorkDetailProps {
  work: Work;
  space: Space | null;
  item: Item | null;
  contacts: Contact[];
  today: ISODate;
  onStatusChange: (status: WorkStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** "$410 so far · budget $600", "$240", or "—". */
function describeCost(work: Work): string {
  const finished = isFinished(work);
  const cost = work.cost !== null ? `${formatMoney(work.cost)}${finished ? "" : work.kind === "project" ? " so far" : " quoted"}` : "";
  const budget = work.budget !== null ? `budget ${formatMoney(work.budget)}` : "";
  return [cost, budget].filter(Boolean).join(" · ") || "—";
}

export function WorkDetail({ work, space, item, contacts, today, onStatusChange, onEdit, onDelete }: WorkDetailProps) {
  const info = WORK_KIND_INFO[work.kind];
  const date = (value: ISODate | null) => (value ? formatShortDate(value, today) : "—");

  const where = space ? (
    <>
      <Link href={roomHref(space.id)} className="underline decoration-border underline-offset-4 hover:decoration-foreground">
        {space.name}
      </Link>
      {item && (
        <>
          {" · "}
          <Link href={itemHref(space.id, item.id)} className="underline decoration-border underline-offset-4 hover:decoration-foreground">
            {item.name}
          </Link>
        </>
      )}
    </>
  ) : (
    "—"
  );

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: item ? "Room · item" : "Room", value: where },
    { label: info.startedLabel, value: date(work.startedOn) },
    { label: info.plannedLabel, value: date(work.plannedOn) },
    ...(isFinished(work) ? [{ label: info.finishedLabel, value: date(work.finishedOn) }] : []),
    { label: "Who did it", value: work.performedBy === "diy" ? "DIY" : "Hired" },
    { label: "Cost", value: describeCost(work) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{work.title}</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${work.title}`} onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${work.title}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Status" className="w-40" value={work.status} onChange={(e) => onStatusChange(e.target.value as WorkStatus)}>
          {info.statuses.map((s) => (
            <option key={s} value={s}>
              {WORK_STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        {!isFinished(work) && (
          <Button size="sm" onClick={() => onStatusChange(info.finishedStatus)}>
            <Check data-icon="inline-start" />
            Mark {WORK_STATUS_LABELS[info.finishedStatus].toLowerCase()}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="truncate">{row.value}</dd>
          </div>
        ))}
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Helped by</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {contacts.length === 0
              ? "—"
              : contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={contactHref(contact.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 hover:bg-accent"
                  >
                    <ContactAvatar contact={contact} size="sm" />
                    {contact.name}
                  </Link>
                ))}
          </dd>
        </div>
      </dl>

      {work.notes && (
        <section className="flex flex-col gap-1.5" aria-labelledby="notes-heading">
          <h3 id="notes-heading" className="text-sm font-bold">
            Notes
          </h3>
          <p className="text-sm whitespace-pre-line text-muted-foreground">{work.notes}</p>
        </section>
      )}
    </div>
  );
}
