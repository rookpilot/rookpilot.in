import type { BuildingSummary } from "@/lib/data/selectors";
import { cn } from "@/lib/utils";

export function SummaryCards({ summary }: { summary: BuildingSummary }) {
  const cards = [
    { label: "Overdue", value: summary.overdue, tone: summary.overdue > 0 ? "text-overdue" : undefined },
    { label: "Due this week", value: summary.dueThisWeek, tone: summary.dueThisWeek > 0 ? "text-due-soon" : undefined },
    { label: "Items tracked", value: summary.items },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="flex flex-col gap-0.5 rounded-xl border bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{card.label}</dt>
          <dd className={cn("font-heading text-3xl font-bold tabular-nums", card.tone)}>{card.value}</dd>
        </div>
      ))}
    </dl>
  );
}
