"use client";

import type { LucideIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface ChoiceProps<T extends string> {
  /** Names the group for screen readers. */
  label: string;
  value: T | "";
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/** Joined buttons where exactly one is on, like List / Week / Month. */
export function SegmentedControl<T extends string>({ label, value, options, onChange, className }: ChoiceProps<T>) {
  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className={cn("overflow-hidden rounded-md border bg-card", className)}
    >
      {options.map(({ value: v, label: text, icon: Icon }) => (
        <ToggleGroupItem
          key={v}
          value={v}
          className="h-8 rounded-none border-r px-3 text-[13px] last:border-r-0 hover:bg-muted data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground"
        >
          {Icon && <Icon data-icon="inline-start" />}
          {text}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A row of pill filters where one is on, like All / Open / In progress / Fixed. */
export function FilterChips<T extends string>({ label, value, options, onChange, className }: ChoiceProps<T>) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      spacing={1.5}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className={cn("flex-wrap", className)}
    >
      {options.map(({ value: v, label: text }) => (
        <ToggleGroupItem
          key={v}
          value={v}
          className="h-7 rounded-full border bg-card px-3 text-[13px] hover:bg-muted data-[state=on]:border-foreground/40 data-[state=on]:bg-primary-soft data-[state=on]:font-semibold"
        >
          {text}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
