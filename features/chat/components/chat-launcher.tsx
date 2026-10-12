import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** The floating "Ask Rookpilot" button in the bottom corner. */
export function ChatLauncher({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ask Rookpilot (⌘J)"
      className={cn(
        "fixed right-5 bottom-5 z-40 flex h-12 items-center gap-2 rounded-full bg-foreground pr-5 pl-4 text-sm font-medium text-background shadow-lg shadow-black/15 transition-all duration-300 outline-none",
        "hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-ring/50",
        hidden && "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      Ask Rookpilot
    </button>
  );
}
