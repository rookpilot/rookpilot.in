"use client";

import { SegmentedControl } from "@/components/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConfirmMode } from "@/lib/agent/confirm";

import { useConfirmMode } from "../hooks/use-confirm-mode";

const LEVELS: readonly { value: ConfirmMode; label: string; description: string }[] = [
  { value: "rarely", label: "Rarely", description: "Only before deleting something, or when Rookpilot had to guess a detail." },
  { value: "sometimes", label: "Sometimes", description: "Before adding or changing anything. Quick things, like marking a task done, just happen." },
  { value: "always", label: "Always", description: "Before every change, even marking a task done." },
];

/** How often Rookpilot shows the confirm card before changing something. More chat settings go here later. */
export function ChatSettings() {
  const { mode, save } = useConfirmMode();
  const selected = LEVELS.find((level) => level.value === mode);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        How often should Rookpilot check with you?
      </p>
      {mode ? (
        <SegmentedControl label="How often should Rookpilot check with you?" value={mode} options={LEVELS} onChange={(next) => void save(next)} className="self-start" />
      ) : (
        <Skeleton className="h-8 w-64" />
      )}
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {selected?.description}
      </p>
    </div>
  );
}
