"use client";

import { useState } from "react";

import { CountStepper } from "@/components/form/count-stepper";
import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import type { BuildingType } from "@/lib/domain/building";
import type { Space } from "@/lib/domain/models";
import { formatSchedules } from "@/lib/domain/schedule";
import { getItemTemplate, ITEM_TEMPLATES, suggestItemTemplates } from "@/lib/templates/items";

import type { NewItemForm } from "../../actions";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Space;
  buildingType: BuildingType;
  onAdd: (form: NewItemForm) => void;
}

export function AddItemDialog({ open, onOpenChange, room, buildingType, onAdd }: AddItemDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <AddItemForm
        room={room}
        buildingType={buildingType}
        onAdd={(form) => {
          onAdd(form);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

const CUSTOM = "__custom";

function AddItemForm({ room, buildingType, onAdd }: Pick<AddItemDialogProps, "room" | "buildingType" | "onAdd">) {
  const suggested = suggestItemTemplates(room.kind, buildingType);
  const others = ITEM_TEMPLATES.filter((t) => !suggested.includes(t));
  const firstChoice = suggested[0] ?? others[0];

  const [choice, setChoice] = useState(firstChoice?.key ?? CUSTOM);
  const [name, setName] = useState(firstChoice?.name ?? "");
  const [count, setCount] = useState(1);
  const [installedOn, setInstalledOn] = useState("");

  const template = choice === CUSTOM ? null : getItemTemplate(choice);

  function changeChoice(key: string) {
    setChoice(key);
    setName(key === CUSTOM ? "" : (getItemTemplate(key)?.name ?? ""));
  }

  return (
    <DialogForm
      title={`Add an item to ${room.name}`}
      submitLabel={count > 1 ? `Add ${count} items` : "Add item"}
      canSubmit={name.trim().length > 0}
      onSubmit={() => onAdd({ spaceId: room.id, templateKey: template?.key ?? null, name, count, installedOn: installedOn || null })}
    >
      <SelectField label="Item" value={choice} onChange={(e) => changeChoice(e.target.value)}>
        {suggested.length > 0 && (
          <optgroup label={`Suggested for ${room.name}`}>
            {suggested.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
        <optgroup label="Other items">
          {others.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </optgroup>
        <option value={CUSTOM}>Something else…</option>
      </SelectField>

      <FormField
        label="Name"
        placeholder="Ceiling fan"
        value={name}
        onChange={(e) => setName(e.target.value)}
        hint={template ? `Timers: ${formatSchedules(template.schedules)}` : "No timers yet. You can add them after."}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">How many?</p>
          <p className="text-xs text-muted-foreground">Each one gets its own timers.</p>
        </div>
        <CountStepper label={name || "items"} value={count} onChange={setCount} />
      </div>

      <FormField
        label="Installed on"
        type="date"
        optional
        value={installedOn}
        onChange={(e) => setInstalledOn(e.target.value)}
        hint="Timers count from this date. Leave blank to count from today."
      />
    </DialogForm>
  );
}
