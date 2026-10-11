import { cn } from "@/lib/utils";

type TagState = "overdue" | "soon" | "done";

const SAMPLE_TAGS: { item: string; room: string; task: string; when: string; state: TagState }[] = [
  { item: "Smoke alarm", room: "Hallway", task: "Battery replaced", when: "Next: Oct 2027", state: "done" },
  { item: "Gutters", room: "Whole house", task: "Clean before the rains", when: "Due in 5 days", state: "soon" },
  { item: "Dishwasher filter", room: "Kitchen", task: "Clean", when: "3 days late", state: "overdue" },
];

const STATE_STYLES: Record<TagState, string> = {
  overdue: "bg-overdue-soft text-overdue",
  soon: "bg-due-soon-soft text-due-soon",
  done: "bg-ok-soft text-ok",
};

/** Brand panel beside the auth form: a few example maintenance tags. Decorative only. */
export function AuthShowcase() {
  return (
    <div className="flex h-full flex-col justify-center gap-12 p-10 xl:p-16">
      <div className="flex max-w-md flex-col gap-3">
        <p className="eyebrow">Your building, on autopilot</p>
        <h2 className="text-4xl font-bold tracking-[-0.02em] xl:text-5xl">
          Every filter, alarm, and gutter on its own timer.
        </h2>
        <p className="text-muted-foreground">
          Tell Rookpilot what you fixed and it resets the reminder. It remembers the pros you trust and what each job cost.
        </p>
      </div>

      <ul className="flex max-w-md flex-col gap-3" aria-label="Example maintenance tasks">
        {SAMPLE_TAGS.map((tag) => (
          <li key={tag.item} className="flex items-center gap-4 rounded-md border bg-card px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {tag.item} <span className="font-normal text-muted-foreground">· {tag.room}</span>
              </p>
              <p className="truncate text-sm text-muted-foreground">{tag.task}</p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 font-mono text-[11px] whitespace-nowrap", STATE_STYLES[tag.state])}>
              {tag.when}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
