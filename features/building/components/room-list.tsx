"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pane } from "@/components/layout/pane";
import { RowMenu } from "@/components/row-menu";
import { selectableRow } from "@/components/selectable-row";
import { Button } from "@/components/ui/button";
import type { Space } from "@/lib/domain/models";
import { cn } from "@/lib/utils";

import type { BuildingActions } from "../actions";
import { RoomDialog } from "./dialogs/room-dialog";

interface RoomListProps {
  rooms: Space[];
  itemCounts: Map<string, number>;
  selectedId: string | null;
  visibleOnMobile: boolean;
  onSelect: (roomId: string) => void;
  actions: BuildingActions;
}

type DialogState = { kind: "add" } | { kind: "edit"; room: Space } | { kind: "delete"; room: Space } | null;

export function RoomList({ rooms, itemCounts, selectedId, visibleOnMobile, onSelect, actions }: RoomListProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <Pane
      title="Rooms"
      subtitle={`${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`}
      visibleOnMobile={visibleOnMobile}
      action={
        <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "add" })}>
          <Plus data-icon="inline-start" />
          Room
        </Button>
      }
    >
      <ul className="flex flex-col gap-1.5">
        {rooms.map((room) => {
          const selected = room.id === selectedId;
          const count = itemCounts.get(room.id) ?? 0;
          return (
            <li
              key={room.id}
              className={selectableRow(selected, "group flex items-center gap-1 pr-1")}
            >
              <button
                type="button"
                onClick={() => onSelect(room.id)}
                aria-current={selected ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className={cn("truncate", selected && "font-semibold")}>{room.name}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
              </button>
              <RowMenu
                label={room.name}
                onEdit={() => setDialog({ kind: "edit", room })}
                onDelete={room.kind === "whole_building" ? undefined : () => setDialog({ kind: "delete", room })}
              />
            </li>
          );
        })}
      </ul>

      <RoomDialog
        open={dialog?.kind === "add" || dialog?.kind === "edit"}
        onOpenChange={close}
        room={dialog?.kind === "edit" ? dialog.room : undefined}
        onSave={(values) => {
          if (dialog?.kind === "edit") actions.updateRoom(dialog.room.id, values);
          else onSelect(actions.addRoom(values.name, values.kind));
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={close}
        title={dialog?.kind === "delete" ? `Delete ${dialog.room.name}?` : ""}
        description={
          dialog?.kind === "delete"
            ? `This also deletes its ${itemCounts.get(dialog.room.id) ?? 0} items and their timers.`
            : ""
        }
        confirmLabel="Delete room"
        onConfirm={() => dialog?.kind === "delete" && actions.deleteRoom(dialog.room.id)}
      />
    </Pane>
  );
}
