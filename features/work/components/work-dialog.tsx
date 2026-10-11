"use client";

import { useState } from "react";

import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { MoneyField } from "@/components/form/money-field";
import { SelectField } from "@/components/form/select-field";
import { TextareaField } from "@/components/form/textarea-field";
import { ContactPicker } from "@/features/contacts/components/contact-picker";
import type { Contact, ISODate, Item, PerformedBy, Space, Work, WorkKind, WorkStatus } from "@/lib/domain/models";
import { WORK_KIND_INFO, WORK_STATUS_LABELS } from "@/lib/domain/work";
import { moneyInput, parseMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import type { WorkForm } from "../actions";

interface WorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: WorkKind;
  /** Edit this one; leave out to add a new one. */
  work?: Work;
  rooms: Space[];
  items: Item[];
  contacts: Contact[];
  today: ISODate;
  onSave: (form: WorkForm) => void;
}

/** The add / edit form shared by Projects and Repairs. */
export function WorkDialog({ open, onOpenChange, onSave, ...props }: WorkDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <WorkFormBody
        {...props}
        onSave={(form) => {
          onSave(form);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

const PERFORMED_BY: { value: PerformedBy; label: string }[] = [
  { value: "diy", label: "DIY" },
  { value: "hired", label: "Hired" },
];

function WorkFormBody({ kind, work, rooms, items, contacts, today, onSave }: Omit<WorkDialogProps, "open" | "onOpenChange">) {
  const info = WORK_KIND_INFO[kind];
  const [title, setTitle] = useState(work?.title ?? "");
  const [status, setStatus] = useState<WorkStatus>(work?.status ?? info.defaultStatus);
  const [spaceId, setSpaceId] = useState(work?.spaceId ?? "");
  const [itemId, setItemId] = useState(work?.itemId ?? "");
  const [startedOn, setStartedOn] = useState(work?.startedOn ?? (work ? "" : today));
  const [plannedOn, setPlannedOn] = useState(work?.plannedOn ?? "");
  const [performedBy, setPerformedBy] = useState<PerformedBy>(work?.performedBy ?? "diy");
  const [contactIds, setContactIds] = useState(work?.contactIds ?? []);
  const [cost, setCost] = useState(moneyInput(work?.cost ?? null));
  const [budget, setBudget] = useState(moneyInput(work?.budget ?? null));
  const [notes, setNotes] = useState(work?.notes ?? "");

  const roomItems = items.filter((i) => i.spaceId === spaceId);

  return (
    <DialogForm
      title={work ? `Edit ${info.label.toLowerCase()}` : `Add a ${info.label.toLowerCase()}`}
      submitLabel={work ? "Save" : `Add ${info.label.toLowerCase()}`}
      canSubmit={title.trim().length > 0}
      onSubmit={() =>
        onSave({
          title,
          status,
          spaceId: spaceId || null,
          itemId: itemId || null,
          startedOn: startedOn || null,
          plannedOn: plannedOn || null,
          performedBy,
          contactIds,
          cost: parseMoney(cost),
          budget: parseMoney(budget),
          notes,
        })
      }
    >
      <FormField
        label="Title"
        placeholder={kind === "repair" ? "Grinding garage door" : "Backyard fire pit"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Room"
          value={spaceId}
          onChange={(e) => {
            setSpaceId(e.target.value);
            setItemId("");
          }}
        >
          <option value="">No room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Item" value={itemId} disabled={roomItems.length === 0} onChange={(e) => setItemId(e.target.value)}>
          <option value="">{roomItems.length === 0 ? "None in this room" : "No item"}</option>
          {roomItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
      </div>
      <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as WorkStatus)}>
        {info.statuses.map((s) => (
          <option key={s} value={s}>
            {WORK_STATUS_LABELS[s]}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={info.startedLabel} type="date" optional value={startedOn} onChange={(e) => setStartedOn(e.target.value)} />
        <FormField
          label={info.plannedLabel}
          type="date"
          optional
          hint="Shows on the calendar."
          value={plannedOn}
          onChange={(e) => setPlannedOn(e.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Who did it</legend>
        <div className="grid grid-cols-2 gap-2">
          {PERFORMED_BY.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                performedBy === option.value && "border-primary bg-primary-soft font-medium",
              )}
            >
              <input
                type="radio"
                name="performed-by"
                className="sr-only"
                checked={performedBy === option.value}
                onChange={() => setPerformedBy(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <ContactPicker contacts={contacts} value={contactIds} onChange={setContactIds} />

      <div className="grid grid-cols-2 gap-3">
        <MoneyField label="Cost" value={cost} onChange={setCost} />
        {info.hasBudget && <MoneyField label="Budget" value={budget} onChange={setBudget} />}
      </div>
      <TextareaField label="Notes" optional value={notes} onChange={(e) => setNotes(e.target.value)} />
    </DialogForm>
  );
}
