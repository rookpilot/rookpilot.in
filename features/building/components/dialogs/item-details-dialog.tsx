"use client";

import { useState } from "react";

import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import { TextareaField } from "@/components/form/textarea-field";
import type { Item, Space } from "@/lib/domain/models";

type ItemDetails = Pick<Item, "name" | "spaceId" | "brand" | "model" | "installedOn" | "notes">;

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  rooms: Space[];
  onSave: (details: ItemDetails) => void;
}

export function ItemDetailsDialog({ open, onOpenChange, item, rooms, onSave }: ItemDetailsDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <ItemDetailsForm
        item={item}
        rooms={rooms}
        onSave={(details) => {
          onSave(details);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

function ItemDetailsForm({ item, rooms, onSave }: Pick<ItemDetailsDialogProps, "item" | "rooms" | "onSave">) {
  const [details, setDetails] = useState<ItemDetails>({
    name: item.name,
    spaceId: item.spaceId,
    brand: item.brand,
    model: item.model,
    installedOn: item.installedOn,
    notes: item.notes,
  });
  const set = (patch: Partial<ItemDetails>) => setDetails((prev) => ({ ...prev, ...patch }));

  return (
    <DialogForm
      title="Edit item"
      submitLabel="Save"
      canSubmit={details.name.trim().length > 0}
      onSubmit={() => onSave({ ...details, name: details.name.trim() })}
    >
      <FormField label="Name" value={details.name} onChange={(e) => set({ name: e.target.value })} />
      <SelectField label="Room" value={details.spaceId} onChange={(e) => set({ spaceId: e.target.value })}>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Brand" optional value={details.brand} onChange={(e) => set({ brand: e.target.value })} />
        <FormField label="Model" optional value={details.model} onChange={(e) => set({ model: e.target.value })} />
      </div>
      <FormField
        label="Installed on"
        type="date"
        optional
        value={details.installedOn ?? ""}
        onChange={(e) => set({ installedOn: e.target.value || null })}
      />
      <TextareaField label="Notes" optional value={details.notes} onChange={(e) => set({ notes: e.target.value })} />
    </DialogForm>
  );
}
