"use client";

import { useId, useState } from "react";

import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { MoneyField } from "@/components/form/money-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ContactPicker } from "@/features/contacts/components/contact-picker";
import { selectContacts, type AgendaEntry } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building, Contact, ISODate } from "@/lib/domain/models";
import { parseMoney } from "@/lib/money";

import { markDone } from "../actions";
import { taskLabel } from "../events";

interface MarkDoneDialogProps {
  /** The timers to mark done (more than one for a grouped calendar task), or null when closed. */
  target: AgendaEntry[] | null;
  onClose: () => void;
  data: AppData;
  building: Building;
}

/** The small form behind every "Mark done" button: date, cost, note, and who helped. */
export function MarkDoneDialog({ target, onClose, data, building }: MarkDoneDialogProps) {
  return (
    <FormDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <MarkDoneForm
          entries={target}
          contacts={selectContacts(data)}
          today={data.today}
          onSave={(entries, form) => {
            markDone(building, entries, form);
            onClose();
          }}
        />
      )}
    </FormDialog>
  );
}

interface MarkDoneFormProps {
  entries: AgendaEntry[];
  contacts: Contact[];
  today: ISODate;
  onSave: (entries: AgendaEntry[], form: { doneOn: ISODate; note: string; cost: number | null; contactIds: string[] }) => void;
}

function MarkDoneForm({ entries, contacts, today, onSave }: MarkDoneFormProps) {
  const [doneOn, setDoneOn] = useState(today);
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [selected, setSelected] = useState(() => new Set(entries.map((e) => e.schedule.id)));

  const several = entries.length > 1;
  const chosen = entries.filter((e) => selected.has(e.schedule.id));
  const validDate = doneOn !== "" && doneOn <= today;
  const rooms = [...new Set(entries.map((e) => e.space.name))].join(", ");

  return (
    <DialogForm
      title="Mark done"
      description={`${taskLabel(entries)} · ${rooms}`}
      submitLabel={several ? `Mark ${chosen.length} done` : "Mark done"}
      canSubmit={validDate && chosen.length > 0}
      onSubmit={() => onSave(chosen, { doneOn, note, cost: parseMoney(cost), contactIds })}
    >
      {several && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">Which ones?</legend>
          <div className="grid grid-cols-2 gap-2">
            {entries.map((entry) => (
              <EntryCheckbox
                key={entry.schedule.id}
                entry={entry}
                checked={selected.has(entry.schedule.id)}
                onChange={(on) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (on) next.add(entry.schedule.id);
                    else next.delete(entry.schedule.id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Done on"
          type="date"
          max={today}
          value={doneOn}
          error={doneOn > today ? "Can't be in the future." : undefined}
          onChange={(e) => setDoneOn(e.target.value)}
        />
        <MoneyField label={several ? "Cost, each" : "Cost"} value={cost} onChange={setCost} />
      </div>
      <TextareaField label="Note" optional rows={2} placeholder="Anything worth remembering" value={note} onChange={(e) => setNote(e.target.value)} />
      <ContactPicker contacts={contacts} value={contactIds} onChange={setContactIds} />
    </DialogForm>
  );
}

function EntryCheckbox({ entry, checked, onChange }: { entry: AgendaEntry; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <Label htmlFor={id} className="min-w-0 flex-col items-start gap-0">
        <span className="truncate">{entry.item.name}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">{entry.space.name}</span>
      </Label>
    </div>
  );
}
