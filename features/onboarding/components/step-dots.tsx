import { cn } from "@/lib/utils";

import { STEPS } from "../steps";

interface StepDotsProps {
  currentIndex: number;
  /** The furthest step reached; steps up to it count as done. */
  furthestIndex: number;
  canGoTo: (index: number) => boolean;
  onSelect: (index: number) => void;
}

/** One dot per step. Filled dots are reached (done or current); the current one is a little wider. Reached steps can be clicked. */
export function StepDots({ currentIndex, furthestIndex, canGoTo, onSelect }: StepDotsProps) {
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isFilled = index <= Math.max(currentIndex, furthestIndex);
          const reachable = canGoTo(index) && !isCurrent;
          return (
            <li key={step.id} className="flex">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(index)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${isFilled && !isCurrent ? ", done" : ""}`}
                title={step.label}
                className="group flex h-6 items-center justify-center px-0.5 outline-none disabled:cursor-default"
              >
                <span
                  className={cn(
                    "block h-2.5 rounded-full border-[1.5px] border-foreground transition-all duration-300 ease-out",
                    isCurrent ? "w-7 bg-foreground" : "w-2.5",
                    isFilled ? "bg-foreground" : "border-foreground/30 bg-transparent",
                    reachable && "group-hover:scale-125 group-focus-visible:ring-3 group-focus-visible:ring-ring/50",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
