import { cn } from "@/lib/utils";

/** A bordered row in a list → detail layout. The open one gets a darker border and a gray fill. */
export function selectableRow(selected: boolean, className?: string): string {
  return cn(
    "rounded-md border bg-card transition-colors hover:border-foreground/25",
    selected && "border-foreground/40 bg-primary-soft hover:border-foreground/40",
    className,
  );
}
