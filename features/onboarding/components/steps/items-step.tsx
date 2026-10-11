"use client";

import { Plus, X } from "lucide-react";
import { useId, useState } from "react";

import { CountStepper } from "@/components/form/count-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { ROOM_KIND_LABELS } from "@/lib/domain/room";
import { formatSchedules } from "@/lib/domain/schedule";
import { getItemTemplate, ITEM_TEMPLATES } from "@/lib/templates/items";
import { cn } from "@/lib/utils";

import type { OnboardingTotals } from "../../selectors";
import type { ItemDraft, RoomDraft } from "../../state";

interface ItemsStepProps {
  rooms: RoomDraft[];
  items: ItemDraft[];
  totals: OnboardingTotals;
  onToggle: (id: string, selected: boolean) => void;
  onCountChange: (id: string, count: number) => void;
  onRemove: (id: string) => void;
  onAdd: (roomId: string, name: string) => void;
}

const TEMPLATE_LIST_ID = "item-template-names";

export function ItemsStep({ rooms, items, totals, onToggle, onCountChange, onRemove, onAdd }: ItemsStepProps) {
  if (rooms.length === 0) {
    return (
      <EmptyState>
        There are no rooms yet. Go back to add rooms, or finish and add items later from the Building tab.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TotalsBar totals={totals} />

      {/* Shared suggestions for every "Add item" field. */}
      <datalist id={TEMPLATE_LIST_ID}>
        {ITEM_TEMPLATES.map((t) => (
          <option key={t.key} value={t.name} />
        ))}
      </datalist>

      {rooms.map((room) => (
        <RoomItems
          key={room.id}
          room={room}
          items={items.filter((item) => item.roomId === room.id)}
          onToggle={onToggle}
          onCountChange={onCountChange}
          onRemove={onRemove}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

function TotalsBar({ totals }: { totals: OnboardingTotals }) {
  const stats = [
    { label: "Rooms", value: totals.rooms },
    { label: "Items", value: totals.items },
    { label: "Timers", value: totals.timers },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="font-heading text-2xl font-bold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface RoomItemsProps extends Omit<ItemsStepProps, "rooms" | "items" | "totals"> {
  room: RoomDraft;
  items: ItemDraft[];
}

function RoomItems({ room, items, onToggle, onCountChange, onRemove, onAdd }: RoomItemsProps) {
  const [newItem, setNewItem] = useState("");
  const inputId = useId();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    onAdd(room.id, newItem);
    setNewItem("");
  }

  return (
    <section className="flex flex-col gap-2" aria-labelledby={`${inputId}-heading`}>
      <h3 id={`${inputId}-heading`} className="flex items-baseline gap-2 text-base font-bold">
        {room.name || "Unnamed room"}
        <span className="font-sans text-xs font-normal text-muted-foreground">{ROOM_KIND_LABELS[room.kind]}</span>
      </h3>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onToggle={onToggle} onCountChange={onCountChange} onRemove={onRemove} />
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          id={inputId}
          list={TEMPLATE_LIST_ID}
          aria-label={`Add an item to ${room.name || "this room"}`}
          placeholder="Add an item, like Ceiling fan"
          className="h-9 flex-1"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={!newItem.trim()}>
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </form>
    </section>
  );
}

interface ItemRowProps {
  item: ItemDraft;
  onToggle: (id: string, selected: boolean) => void;
  onCountChange: (id: string, count: number) => void;
  onRemove: (id: string) => void;
}

function ItemRow({ item, onToggle, onCountChange, onRemove }: ItemRowProps) {
  const checkboxId = useId();
  const template = item.templateKey ? getItemTemplate(item.templateKey) : undefined;
  const caption = template ? formatSchedules(template.schedules) : "Custom item. Add timers later.";

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Checkbox id={checkboxId} checked={item.selected} onCheckedChange={(checked) => onToggle(item.id, checked === true)} />
      <label htmlFor={checkboxId} className={cn("min-w-0 flex-1 cursor-pointer", !item.selected && "opacity-60")}>
        <span className="block truncate text-sm font-medium">{item.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{caption}</span>
      </label>
      {item.selected && <CountStepper label={item.name} value={item.count} onChange={(count) => onCountChange(item.id, count)} />}
      {!item.templateKey && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>
          <X />
        </Button>
      )}
    </li>
  );
}
