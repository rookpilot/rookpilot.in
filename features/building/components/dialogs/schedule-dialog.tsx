"use client";

import { useId, useState } from "react";

import { DialogForm, FormDialog } from "@/components/form/form-dialog";
import { FormField } from "@/components/form/form-field";
import { NativeSelect } from "@/components/form/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Schedule } from "@/lib/domain/models";
import type { IntervalUnit, RepeatRule, Season } from "@/lib/domain/schedule";
import { cn } from "@/lib/utils";

import type { ScheduleForm } from "../../actions";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this timer; leave out to add a new one. */
  schedule?: Schedule;
  onSave: (form: ScheduleForm) => void;
}

export function ScheduleDialog({ open, onOpenChange, schedule, onSave }: ScheduleDialogProps) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <ScheduleFormBody
        schedule={schedule}
        onSave={(form) => {
          onSave(form);
          onOpenChange(false);
        }}
      />
    </FormDialog>
  );
}

const UNITS: { value: IntervalUnit; label: string }[] = [
  { value: "day", label: "days" },
  { value: "week", label: "weeks" },
  { value: "month", label: "months" },
  { value: "year", label: "years" },
];
const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

function ScheduleFormBody({ schedule, onSave }: Pick<ScheduleDialogProps, "schedule" | "onSave">) {
  const initial = schedule?.repeat;
  const [title, setTitle] = useState(schedule?.title ?? "");
  const [kind, setKind] = useState<RepeatRule["kind"]>(initial?.kind ?? "interval");
  const [count, setCount] = useState(initial?.kind === "interval" ? String(initial.count) : "1");
  const [unit, setUnit] = useState<IntervalUnit>(initial?.kind === "interval" ? initial.unit : "month");
  const [seasons, setSeasons] = useState<Season[]>(initial?.kind === "seasonal" ? [...initial.seasons] : []);
  const countId = useId();

  const countValue = Number.parseInt(count, 10);
  const repeat: RepeatRule | null =
    kind === "interval"
      ? countValue >= 1
        ? { kind, count: countValue, unit }
        : null
      : seasons.length > 0
        ? { kind, seasons: SEASONS.filter((s) => seasons.includes(s)) }
        : null;

  function toggleSeason(season: Season, checked: boolean) {
    setSeasons((prev) => (checked ? [...prev, season] : prev.filter((s) => s !== season)));
  }

  return (
    <DialogForm
      title={schedule ? "Edit timer" : "Add a timer"}
      description={schedule ? "Changing how often it repeats moves the next due date." : undefined}
      submitLabel={schedule ? "Save" : "Add timer"}
      canSubmit={title.trim().length > 0 && repeat !== null}
      onSubmit={() => repeat && onSave({ title, repeat })}
    >
      <FormField label="Task" placeholder="Replace battery" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">Repeats</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "interval", label: "Every few days, weeks, …" },
              { value: "seasonal", label: "By season" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-center text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                kind === option.value && "border-primary bg-primary-soft font-medium",
              )}
            >
              <input
                type="radio"
                name="repeat-kind"
                className="sr-only"
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>

        {kind === "interval" ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={countId} className="shrink-0">
              Every
            </Label>
            <Input
              id={countId}
              inputMode="numeric"
              className="h-9 w-20"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))}
            />
            <NativeSelect aria-label="Unit" className="flex-1" value={unit} onChange={(e) => setUnit(e.target.value as IntervalUnit)}>
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {SEASONS.map((season) => (
              <SeasonCheckbox key={season} season={season} checked={seasons.includes(season)} onChange={toggleSeason} />
            ))}
          </div>
        )}
      </fieldset>
    </DialogForm>
  );
}

function SeasonCheckbox({
  season,
  checked,
  onChange,
}: {
  season: Season;
  checked: boolean;
  onChange: (season: Season, checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(season, value === true)} />
      <Label htmlFor={id} className="capitalize">
        {season}
      </Label>
    </div>
  );
}
