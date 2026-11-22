"use client";

import { Check, Loader2, X } from "lucide-react";

import { useAppData } from "@/lib/data/store";
import { cn } from "@/lib/utils";

import { stepLabel, type Step } from "../steps";

/** What Rookpilot did (or is doing), one quiet line per tool. */
export function StepList({ steps, className }: { steps: Step[]; className?: string }) {
  const data = useAppData();
  if (steps.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-1 self-start text-xs text-muted-foreground", className)} aria-label="What Rookpilot did">
      {steps.map((step) => (
        <li key={step.id} className="flex animate-in items-center gap-1.5 duration-200 fade-in-0 motion-reduce:animate-none">
          {step.status === "running" ? (
            <Loader2 className="size-3 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : step.status === "done" ? (
            <Check className="size-3 shrink-0 text-ok" aria-hidden="true" />
          ) : (
            <X className="size-3 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <span className={cn(step.status === "failed" && "text-destructive")}>{stepLabel(step, data)}</span>
        </li>
      ))}
    </ul>
  );
}
