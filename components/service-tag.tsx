import { cn } from "@/lib/utils";

/** A dashed inspection-tag label, the brand's "service tag" motif. */
export function ServiceTag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("flex items-center gap-2 self-start rounded border border-dashed border-tag bg-tag-soft px-2.5 py-1 font-mono text-[11px]", className)}>
      <span className="size-2 shrink-0 rounded-full bg-tag" aria-hidden="true" />
      {children}
    </p>
  );
}
