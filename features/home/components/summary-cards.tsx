import Link from "next/link";

import type { BuildingSummary } from "@/lib/data/selectors";
import { cn } from "@/lib/utils";

export function SummaryCards({ summary }: { summary: BuildingSummary }) {
  const cards = [
    { label: "Overdue", value: summary.overdue, href: "/app/schedule?view=list", tone: summary.overdue > 0 ? "text-overdue" : undefined },
    {
      label: "Due this week",
      value: summary.dueThisWeek,
      href: "/app/schedule?view=week",
      tone: summary.dueThisWeek > 0 ? "text-due-soon" : undefined,
    },
    {
      label: summary.openRepairs === 1 ? "Open repair" : "Open repairs",
      value: summary.openRepairs,
      href: "/app/repairs",
      tone: summary.openRepairs > 0 ? "text-work" : undefined,
    },
  ];

  return (
    <ul className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <li key={card.label}>
          <Link
            href={card.href}
            className="flex flex-col gap-0.5 rounded-xl border bg-card px-4 py-3 outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className={cn("font-heading text-3xl font-bold tabular-nums", card.tone)}>{card.value}</span>
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
