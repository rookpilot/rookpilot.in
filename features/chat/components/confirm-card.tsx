"use client";

import { Check, Pencil, TriangleAlert, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Decision } from "@/lib/agent/state";
import type { Decisions, PendingChange } from "@/lib/agent/nodes/humanReview";
import { useAppData } from "@/lib/data/store";
import { cn } from "@/lib/utils";

import { describeChange, type Field } from "../describe";

interface ConfirmCardProps {
  changes: PendingChange[];
  /** Set once answered: the card then shows what was decided instead of buttons. */
  answers?: Decisions;
  /** Called once every change has an answer. */
  onAnswer: (answers: Decisions) => void;
  disabled?: boolean;
}

/** The changes Claude wants to make, each with Confirm, Edit, and Cancel. */
export function ConfirmCard({ changes, answers, onAnswer, disabled }: ConfirmCardProps) {
  const [draft, setDraft] = useState<Decisions>({});
  const decided = answers ?? draft;

  function decide(toolCallId: string, decision: Decision) {
    const next = { ...draft, [toolCallId]: decision };
    setDraft(next);
    if (changes.every((change) => next[change.toolCallId])) onAnswer(next);
  }

  return (
    <div className="flex w-full max-w-[92%] animate-in flex-col gap-2 self-start duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none">
      {changes.map((change) => (
        <ChangeCard
          key={change.toolCallId}
          change={change}
          decision={decided[change.toolCallId]}
          answered={Boolean(answers)}
          disabled={disabled}
          onDecide={(decision) => decide(change.toolCallId, decision)}
        />
      ))}
    </div>
  );
}

const OUTCOMES: Record<Decision["action"], string> = { confirm: "Confirmed", edit: "Confirmed with your edits", cancel: "Cancelled" };

function ChangeCard({
  change,
  decision,
  answered,
  disabled,
  onDecide,
}: {
  change: PendingChange;
  decision?: Decision;
  answered: boolean;
  disabled?: boolean;
  onDecide: (decision: Decision) => void;
}) {
  const data = useAppData();
  const view = describeChange(change, data);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const isDelete = change.kind === "delete";
  const editable = view.fields.filter((field) => field.edit);

  function saveEdits() {
    const input: Record<string, unknown> = {};
    for (const field of editable) {
      const value = values[field.key];
      if (value === undefined || value === String(field.value)) continue;
      input[field.key] = field.edit === "number" ? Number(value) : value;
    }
    setEditing(false);
    onDecide(Object.keys(input).length ? { action: "edit", input } : { action: "confirm" });
  }

  return (
    <section
      aria-label={view.title}
      className={cn("rounded-2xl border bg-card p-3 text-sm shadow-xs", isDelete && "border-destructive/30", decision?.action === "cancel" && "opacity-60")}
    >
      <header className="mb-2">
        <p className={cn("font-mono text-[11px] tracking-wide uppercase", isDelete ? "text-destructive" : "text-muted-foreground")}>{view.title}</p>
        {view.record && <p className="font-semibold">{view.record}</p>}
      </header>

      {view.fields.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {view.fields.map((field) => (
            <Row key={field.key} field={field} editing={editing} value={values[field.key]} onChange={(value) => setValues({ ...values, [field.key]: value })} />
          ))}
        </dl>
      )}

      {change.effects && (
        <p className="mt-2 flex gap-1.5 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {change.effects}
        </p>
      )}

      {decision ? (
        <p className="mt-2 text-xs text-muted-foreground">{answered ? OUTCOMES[decision.action] : "Waiting for the other changes…"}</p>
      ) : editing ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={saveEdits} disabled={disabled}>
            <Check /> Save and confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Back
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant={isDelete ? "destructive" : "default"} onClick={() => onDecide({ action: "confirm" })} disabled={disabled}>
            <Check /> {isDelete ? "Delete" : "Confirm"}
          </Button>
          {editable.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={disabled}>
              <Pencil /> Edit
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDecide({ action: "cancel" })} disabled={disabled}>
            <X /> Cancel
          </Button>
        </div>
      )}
    </section>
  );
}

function Row({ field, editing, value, onChange }: { field: Field; editing: boolean; value?: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <>
      <dt className="text-muted-foreground">
        <label htmlFor={editing && field.edit ? id : undefined}>{field.label}</label>
      </dt>
      <dd className="min-w-0 break-words">
        {editing && field.edit ? (
          <Input
            id={id}
            type={field.edit}
            min={field.edit === "number" ? 0 : undefined}
            className="h-7"
            value={value ?? String(field.value)}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          field.text
        )}
      </dd>
    </>
  );
}
