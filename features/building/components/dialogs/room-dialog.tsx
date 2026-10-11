"use client";

import { useState } from "react";

import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import type { Space } from "@/lib/domain/models";
import { ROOM_KIND_LABELS, ROOM_KINDS, type RoomKind } from "@/lib/domain/room";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this room; leave out to add a new one. */
  room?: Space;
  onSave: (values: { name: string; kind: RoomKind }) => void;
}

export function RoomDialog({ open, onOpenChange, room, onSave }: RoomDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <RoomForm
        room={room}
        onSave={(values) => {
          onSave(values);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

const SELECTABLE_KINDS = ROOM_KINDS.filter((kind) => kind !== "whole_building");

function RoomForm({ room, onSave }: Pick<RoomDialogProps, "room" | "onSave">) {
  const [name, setName] = useState(room?.name ?? "");
  const [kind, setKind] = useState<RoomKind>(room?.kind ?? "other");
  const isWholeBuilding = room?.kind === "whole_building";

  return (
    <DialogForm
      title={room ? "Edit room" : "Add a room"}
      submitLabel={room ? "Save" : "Add room"}
      canSubmit={name.trim().length > 0}
      onSubmit={() => onSave({ name, kind })}
    >
      <FormField label="Name" placeholder="Guest bedroom" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      {!isWholeBuilding && (
        <SelectField label="Kind of room" value={kind} onChange={(e) => setKind(e.target.value as RoomKind)}>
          {SELECTABLE_KINDS.map((k) => (
            <option key={k} value={k}>
              {ROOM_KIND_LABELS[k]}
            </option>
          ))}
        </SelectField>
      )}
    </DialogForm>
  );
}
