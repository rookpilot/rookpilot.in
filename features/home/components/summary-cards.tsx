import { CalendarClock, CircleAlert, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { BuildingSummary } from "@/lib/data/selectors";
import { cn } from "@/lib/utils";

interface Card {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  /** Color for the number and icon when the count isn't zero. */
  tone: string;
}

export function SummaryCards({ summary }: { summary: BuildingSummary }) {
  const cards: Card[] = [
    { label: "Overdue", value: summary.overdue, href: "/app/schedule?view=list", icon: CircleAlert, tone: "text-overdue bg-overdue-soft" },
    { label: "Due this week", value: summary.dueThisWeek, href: "/app/schedule?view=week", icon: CalendarClock, tone: "text-due-soon bg-due-soon-soft" },
    {
      label: summary.openRepairs === 1 ? "Open repair" : "Open repairs",
      value: summary.openRepairs,
      href: "/app/repairs",
      icon: Wrench,
      tone: "text-work bg-work-soft",
    },
  ];

  return (
    <ul className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <li key={card.label}>
          <Link
            href={card.href}
            className="group flex flex-col gap-3 p-4 transition-all outline-none surface hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                card.value > 0 ? card.tone : "bg-muted text-muted-foreground",
              )}
            >
              <card.icon className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="font-heading text-2xl leading-none font-bold tabular-nums">{card.value}</span>
              <span className="mt-1 text-xs text-muted-foreground">{card.label}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
