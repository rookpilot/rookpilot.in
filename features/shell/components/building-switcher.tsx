"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingTypeIcon } from "@/components/building-type-icon";

import { selectBuilding, useCurrentBuilding } from "../hooks/use-current-building";

export function BuildingSwitcher() {
  const current = useCurrentBuilding();
  if (!current) return <Skeleton className="h-12 w-full rounded-lg" />;

  const { data, building } = current;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
        {building && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <BuildingTypeIcon type={building.type} className="size-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{building?.name ?? "No building"}</span>
          <span className="block truncate text-xs text-muted-foreground">{building?.address.city}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
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
