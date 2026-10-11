"use client";

import { FormField } from "./form-field";

interface MoneyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  className?: string;
}

/** A dollar amount typed as text, so "$1,200" and "6.50" both work. Parse it with parseMoney. */
export function MoneyField({ label, value, onChange, optional = true, className }: MoneyFieldProps) {
  return (
    <FormField
      label={label}
      optional={optional}
      inputMode="decimal"
      placeholder="$0"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,$]/g, ""))}
    />
  );
}
