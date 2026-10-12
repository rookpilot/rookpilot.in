"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { selectBuildingSummary } from "@/lib/data/selectors";
import { cn } from "@/lib/utils";

import { useCurrentBuilding } from "../hooks/use-current-building";
import { isActive, NAV_GROUPS, type NavItem } from "../nav";

interface SidebarNavProps {
  /** Icons only, with names in tooltips. */
  collapsed?: boolean;
  /** Called after a link is chosen, so the phone menu can close. */
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const current = useCurrentBuilding();
  const overdue = current?.building ? selectBuildingSummary(current.data, current.building.id).overdue : 0;

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className={cn("group-label px-2.5 pb-1 transition-opacity", collapsed && "sr-only")}>{group.label}</p>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href, pathname)}
              badge={item.showsOverdue ? overdue : 0}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  badge: number;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, active, badge, collapsed, onNavigate }: NavLinkProps) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "bg-sidebar-accent font-medium text-foreground shadow-xs ring-1 ring-sidebar-border",
        collapsed && "justify-center px-0",
      )}
    >
      <item.icon className={cn("size-[18px] shrink-0", active && "text-foreground")} aria-hidden="true" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {badge > 0 &&
        (collapsed ? (
          <span className="absolute top-1.5 right-2 size-2 rounded-full bg-overdue" aria-hidden="true" />
        ) : (
          <span className="rounded-full bg-overdue-soft px-1.5 font-mono text-[11px] text-overdue">
            {badge}
            <span className="sr-only"> overdue</span>
          </span>
        ))}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {badge > 0 && ` · ${badge} overdue`}
      </TooltipContent>
    </Tooltip>
  );
}
