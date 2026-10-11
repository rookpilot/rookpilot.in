import { Plus, RotateCcw, X } from "lucide-react";

import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROOM_KIND_LABELS, ROOM_KINDS, type RoomKind } from "@/lib/domain/room";

import type { StepErrors } from "../../selectors";
import type { RoomDraft } from "../../state";

interface RoomsStepProps {
  rooms: RoomDraft[];
  errors: StepErrors;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<RoomDraft, "id">>) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}

/** "Whole building" is picked by kind only; other rooms can't choose it. */
const SELECTABLE_KINDS = ROOM_KINDS.filter((kind) => kind !== "whole_building");

export function RoomsStep({ rooms, errors, onAdd, onUpdate, onRemove, onReset }: RoomsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => {
          const isWholeBuilding = room.kind === "whole_building";
          const error = errors[room.id];
          return (
            <li key={room.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Room name"
                  aria-invalid={error ? true : undefined}
                  placeholder="Room name"
                  className="h-9 flex-1"
                  value={room.name}
                  onChange={(e) => onUpdate(room.id, { name: e.target.value })}
                />
                {isWholeBuilding ? (
                  <span className="hidden w-40 px-2.5 text-sm text-muted-foreground sm:block">Always included</span>
                ) : (
                  <NativeSelect
                    aria-label={`Kind of room for ${room.name || "new room"}`}
                    className="w-32 sm:w-40"
                    value={room.kind}
                    onChange={(e) => onUpdate(room.id, { kind: e.target.value as RoomKind })}
                  >
                    {SELECTABLE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {ROOM_KIND_LABELS[kind]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${room.name || "room"}`}
                  disabled={isWholeBuilding}
                  className={isWholeBuilding ? "invisible" : undefined}
                  onClick={() => onRemove(room.id)}
                >
                  <X />
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add room
        </Button>
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          Reset to suggestions
        </Button>
      </div>
    </div>
  );
}
