import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaneProps {
  title: string;
  subtitle?: string;
  /** False hides the pane on narrow screens; wide screens always show it. */
  visibleOnMobile: boolean;
  onBack?: () => void;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** One column of a list → detail layout, like the Building tab. On phones only the front pane shows. */
export function Pane({ title, subtitle, visibleOnMobile, onBack, backLabel, action, className, children }: PaneProps) {
  return (
    <section
      aria-label={title}
      className={cn("min-w-0 flex-col gap-3", visibleOnMobile ? "flex" : "hidden lg:flex", className)}
    >
      {onBack && (
        <Button variant="ghost" size="sm" className="self-start text-muted-foreground lg:hidden" onClick={onBack}>
          <ChevronLeft data-icon="inline-start" />
          {backLabel}
        </Button>
      )}
      <div className="flex min-h-8 items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
