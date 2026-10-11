"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { selectBuildingSummary } from "@/lib/data/selectors";
import { cn } from "@/lib/utils";

import { useCurrentBuilding } from "../hooks/use-current-building";
import { isActive, NAV_GROUPS } from "../nav";

interface SidebarNavProps {
  /** Called after a link is chosen, so the phone menu can close. */
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const current = useCurrentBuilding();
  const overdue = current?.building ? selectBuildingSummary(current.data, current.building.id).overdue : 0;

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="group-label px-2.5 pb-1">{group.label}</p>
          {group.items.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[14px] transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                  active && "bg-sidebar-accent font-semibold ring-1 ring-sidebar-border",
                )}
              >
                <item.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.showsOverdue && overdue > 0 && (
                  <span className="rounded-full bg-overdue-soft px-1.5 font-mono text-[11px] text-overdue">
                    {overdue}
                    <span className="sr-only"> overdue</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
