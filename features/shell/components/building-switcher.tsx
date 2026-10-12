"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";

import { BuildingTypeIcon } from "@/components/building-type-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { selectBuilding, useCurrentBuilding } from "../hooks/use-current-building";

export function BuildingSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const current = useCurrentBuilding();
  if (!current) return <Skeleton className={collapsed ? "mx-auto size-10 rounded-lg" : "h-12 w-full rounded-lg"} />;

  const { data, building } = current;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={collapsed ? `Building: ${building?.name ?? "none"}` : undefined}
        title={collapsed ? building?.name : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent text-left shadow-xs outline-none transition-colors hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed ? "mx-auto size-10 justify-center p-0" : "w-full px-2 py-2",
        )}
      >
        {building && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <BuildingTypeIcon type={building.type} className="size-4" />
          </span>
        )}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{building?.name ?? "No building"}</span>
              <span className="block truncate text-xs text-muted-foreground">{building?.address.city}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="min-w-60">
        <DropdownMenuLabel>Your buildings</DropdownMenuLabel>
        {data.buildings.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => selectBuilding(b.id)}>
            <BuildingTypeIcon type={b.type} />
            <span className="flex-1 truncate">{b.name}</span>
            {b.id === building?.id && <Check className="text-primary" aria-label="Selected" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding">
            <Plus />
            Add a building
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
