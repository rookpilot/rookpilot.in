import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { STEPS } from "../steps";

interface StepListProps {
  currentIndex: number;
  furthestIndex: number;
  canGoTo: (index: number) => boolean;
  onSelect: (index: number) => void;
}

/** Vertical step list for wide screens. Reached steps are clickable. */
export function StepList({ currentIndex, furthestIndex, canGoTo, onSelect }: StepListProps) {
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex flex-col gap-1">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isReached = index <= furthestIndex;
          const isDone = index < furthestIndex && !isCurrent;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={!canGoTo(index) || isCurrent}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isCurrent && "bg-card font-semibold shadow-xs ring-1 ring-border",
                  !isCurrent && isReached && "hover:bg-card/70",
                  !isReached && "text-muted-foreground",
                  "disabled:cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-primary text-primary",
                  )}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className="flex-1">{step.label}</span>
                {step.optional && <span className="text-xs font-normal text-muted-foreground">optional</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
