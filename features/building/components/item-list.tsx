"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { DuePill } from "@/components/due-pill";
import { EmptyState } from "@/components/empty-state";
import { Pane } from "@/components/layout/pane";
import { selectableRow } from "@/components/selectable-row";
import { Button } from "@/components/ui/button";
import type { BuildingType } from "@/lib/domain/building";
import type { ISODate, Item, Schedule, Space } from "@/lib/domain/models";
import { sortByDue } from "@/lib/scheduling";

import type { BuildingActions } from "../actions";
import { AddItemDialog } from "./dialogs/add-item-dialog";

interface ItemListProps {
  room: Space;
  items: Item[];
  schedulesByItem: Map<string, Schedule[]>;
  selectedId: string | null;
  buildingType: BuildingType;
  today: ISODate;
  visibleOnMobile: boolean;
  onSelect: (itemId: string) => void;
  onBack: () => void;
  actions: BuildingActions;
}

export function ItemList(props: ItemListProps) {
  const { room, items, schedulesByItem, selectedId, buildingType, today, visibleOnMobile, onSelect, onBack, actions } = props;
  const [adding, setAdding] = useState(false);

  return (
    <Pane
      title={room.name}
      subtitle={`${items.length} ${items.length === 1 ? "item" : "items"}`}
      visibleOnMobile={visibleOnMobile}
      onBack={onBack}
      backLabel="Rooms"
      action={
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" />
          Item
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState>
          No items in {room.name} yet. Add one to start its timers.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => {
            const schedules = schedulesByItem.get(item.id) ?? [];
            const next = sortByDue(schedules)[0];
            const selected = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={selected ? "true" : undefined}
                  className={selectableRow(
                    selected,
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {schedules.length === 0 ? "No timers" : `${schedules.length} ${schedules.length === 1 ? "timer" : "timers"}`}
                      {next && ` · next: ${next.title.toLowerCase()}`}
                    </span>
                  </span>
                  {next && <DuePill nextDueOn={next.nextDueOn} today={today} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AddItemDialog
        open={adding}
        onOpenChange={setAdding}
        room={room}
        buildingType={buildingType}
        onAdd={(form) => {
          const id = actions.addItems(form);
          if (id) onSelect(id);
        }}
      />
    </Pane>
  );
}
