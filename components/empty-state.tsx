import { cn } from "@/lib/utils";

/** A dashed box with a short message for an empty list or panel. */
export function EmptyState({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground", className)} {...props}>
      {children}
    </div>
  );
}
