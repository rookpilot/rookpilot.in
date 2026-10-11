"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DuePill } from "@/components/due-pill";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatShortDate } from "@/lib/dates";
import type { ISODate, Item, Schedule, Space } from "@/lib/domain/models";
import { formatRepeat } from "@/lib/domain/schedule";

import type { BuildingActions } from "../actions";
import { ItemDetailsDialog } from "./dialogs/item-details-dialog";
import { ScheduleDialog } from "./dialogs/schedule-dialog";
import { Pane } from "./pane";
import { RowMenu } from "./row-menu";

interface ItemDetailProps {
  item: Item | null;
  room: Space | null;
  rooms: Space[];
  schedules: Schedule[];
  today: ISODate;
  visibleOnMobile: boolean;
  onBack: () => void;
  onDeleted: () => void;
  /** Called when the item is moved to another room, so the selection can follow it. */
  onMoved: (roomId: string) => void;
  actions: BuildingActions;
}

type DialogState =
  | { kind: "details" }
  | { kind: "delete-item" }
  | { kind: "add-timer" }
  | { kind: "edit-timer"; schedule: Schedule }
  | { kind: "delete-timer"; schedule: Schedule }
  | null;

export function ItemDetail({ item, room, rooms, schedules, today, visibleOnMobile, onBack, onDeleted, onMoved, actions }: ItemDetailProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = (open: boolean) => !open && setDialog(null);

  if (!item) {
    return (
      <Pane title="Item" visibleOnMobile={false}>
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Pick an item to see its details and timers.
        </p>
      </Pane>
    );
  }

  const details = [
    { label: "Room", value: room?.name },
    { label: "Brand", value: item.brand },
    { label: "Model", value: item.model },
    { label: "Installed", value: item.installedOn ? formatShortDate(item.installedOn, today) : "" },
  ];

  return (
    <Pane
      title={item.name}
      subtitle={room?.name}
      visibleOnMobile={visibleOnMobile}
      onBack={onBack}
      backLabel={room?.name ?? "Items"}
      action={
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.name}`} onClick={() => setDialog({ kind: "details" })}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${item.name}`} onClick={() => setDialog({ kind: "delete-item" })}>
            <Trash2 />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {details.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{d.label}</dt>
              <dd className="truncate">{d.value || "—"}</dd>
            </div>
          ))}
        </dl>
        {item.notes && <p className="text-sm whitespace-pre-line text-muted-foreground">{item.notes}</p>}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Timers</h3>
        <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "add-timer" })}>
          <Plus data-icon="inline-start" />
          Timer
        </Button>
      </div>

      {schedules.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No timers yet. Add one, like &ldquo;Clean every 6 months&rdquo;.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {schedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              today={today}
              onTogglePause={(paused) => actions.setSchedulePaused(schedule.id, paused)}
              onEdit={() => setDialog({ kind: "edit-timer", schedule })}
              onDelete={() => setDialog({ kind: "delete-timer", schedule })}
            />
          ))}
        </ul>
      )}

      <ItemDetailsDialog
        open={dialog?.kind === "details"}
        onOpenChange={close}
        item={item}
        rooms={rooms}
        onSave={(patch) => {
          actions.updateItem(item.id, patch);
          if (patch.spaceId !== item.spaceId) onMoved(patch.spaceId);
        }}
      />
      <ScheduleDialog
        open={dialog?.kind === "add-timer" || dialog?.kind === "edit-timer"}
        onOpenChange={close}
        schedule={dialog?.kind === "edit-timer" ? dialog.schedule : undefined}
        onSave={(form) =>
          dialog?.kind === "edit-timer" ? actions.updateSchedule(item, dialog.schedule, form) : actions.addSchedule(item, form)
        }
      />
      <ConfirmDialog
        open={dialog?.kind === "delete-item"}
        onOpenChange={close}
        title={`Delete ${item.name}?`}
        description="Its timers are deleted too."
        confirmLabel="Delete item"
        onConfirm={() => {
          actions.deleteItem(item.id);
          onDeleted();
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete-timer"}
        onOpenChange={close}
        title={dialog?.kind === "delete-timer" ? `Delete "${dialog.schedule.title}"?` : ""}
        description="You can pause a timer instead if you only want to stop it for a while."
        confirmLabel="Delete timer"
        onConfirm={() => dialog?.kind === "delete-timer" && actions.deleteSchedule(dialog.schedule.id)}
      />
    </Pane>
  );
}

interface ScheduleRowProps {
  schedule: Schedule;
  today: ISODate;
  onTogglePause: (paused: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ScheduleRow({ schedule, today, onTogglePause, onEdit, onDelete }: ScheduleRowProps) {
  const switchId = useId();
  const paused = !schedule.active;

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {schedule.title} <span className="font-normal text-muted-foreground">· {formatRepeat(schedule.repeat)}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {schedule.lastDoneOn ? `Last done ${formatShortDate(schedule.lastDoneOn, today)}` : "Never done"} · next{" "}
          {formatShortDate(schedule.nextDueOn, today)}
        </p>
      </div>
      <DuePill nextDueOn={schedule.nextDueOn} today={today} paused={paused} />
      <div className="flex items-center gap-1.5">
        <label htmlFor={switchId} className="sr-only">
          {paused ? `Resume ${schedule.title}` : `Pause ${schedule.title}`}
        </label>
        <Switch id={switchId} checked={!paused} onCheckedChange={(on) => onTogglePause(!on)} />
      </div>
      <RowMenu label={schedule.title} onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}
