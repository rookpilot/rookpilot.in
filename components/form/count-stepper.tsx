"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CountStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Names the thing being counted, for screen readers. */
  label: string;
}

export function CountStepper({ value, onChange, min = 1, max = 20, label }: CountStepperProps) {
  return (
    <div className="inline-flex items-center rounded-lg border" role="group" aria-label={`${label} count`}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <span className="w-6 text-center font-mono text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
