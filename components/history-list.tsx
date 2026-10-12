import Link from "next/link";

import { ContactAvatars } from "@/components/contact-avatar";
import { HistoryKindBadge } from "@/components/history-kind-badge";
import { formatShortDate } from "@/lib/dates";
import { historyContactIds, historyCost, historyTitle, type HistoryEntry } from "@/lib/data/selectors";
import type { Contact, ISODate } from "@/lib/domain/models";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

interface HistoryListProps {
  entries: HistoryEntry[];
  today: ISODate;
  contactsById: Map<string, Contact>;
  /** Extra text under the title, like the building name. */
  describe?: (entry: HistoryEntry) => string;
  href: (entry: HistoryEntry) => string | null;
  /** Runs before following a link, e.g. to switch buildings. */
  onFollow?: (entry: HistoryEntry) => void;
  showContacts?: boolean;
  /** Under month headings the year is already shown, so dates skip it. */
  inMonthGroups?: boolean;
}

/** Rows of finished (or tagged) tasks, repairs, and projects. Used by History and a contact's "Helped with". */
export function HistoryList({ entries, today, contactsById, describe, href, onFollow, showContacts = true, inMonthGroups = false }: HistoryListProps) {
  return (
    <ul className="flex flex-col divide-y overflow-hidden surface">
      {entries.map((entry) => {
        const cost = historyCost(entry);
        const contacts = historyContactIds(entry)
          .map((id) => contactsById.get(id))
          .filter((c): c is Contact => Boolean(c));
        const target = href(entry);
        const note = entry.kind === "task" ? entry.log.note : "";
        const subtitle = [entry.space?.name, describe?.(entry), note].filter(Boolean).join(" · ");

        const body = (
          <>
            <span className={cn("shrink-0 pt-0.5 font-mono text-xs whitespace-nowrap text-muted-foreground sm:pt-0", inMonthGroups ? "w-14" : "w-24")}>
              {formatShortDate(entry.date, inMonthGroups ? entry.date : today)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{historyTitle(entry)}</span>
              {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
            </span>
            <HistoryKindBadge kind={entry.kind} className="hidden sm:inline-flex" />
            {showContacts && <ContactAvatars contacts={contacts} />}
            <span className="w-14 shrink-0 text-right font-mono text-xs">{cost !== null ? formatMoney(cost) : "—"}</span>
          </>
        );

        return (
          <li key={`${entry.kind}-${entry.id}`}>
            {target ? (
              <Link href={target} onClick={() => onFollow?.(entry)} className="flex items-start gap-3 px-4 py-2.5 hover:bg-accent/60 sm:items-center">
                {body}
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-4 py-2.5 sm:items-center">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
