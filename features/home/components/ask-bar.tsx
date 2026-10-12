"use client";

import { ArrowUp, Sparkles } from "lucide-react";

import { useShell } from "@/features/shell/shell-context";

/** A big "ask anything" bar that opens the chat panel. */
export function AskBar() {
  const { openChat } = useShell();
  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="group flex h-14 w-full items-center gap-3 rounded-2xl border border-border/70 bg-card pr-2 pl-4 text-left shadow-xs transition-all outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="flex-1 truncate text-muted-foreground">Tell Rookpilot what you fixed, or ask what&apos;s next…</span>
      <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">⌘J</kbd>
      <span className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-105">
        <ArrowUp className="size-4" aria-hidden="true" />
      </span>
    </button>
  );
}
