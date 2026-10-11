import { Check } from "lucide-react";

import { BUILDING_TYPE_INFO, BUILDING_TYPES, type BuildingCategory, type BuildingType } from "@/lib/domain/building";
import { cn } from "@/lib/utils";

import { BuildingTypeIcon } from "../building-type-icon";

interface BuildingTypeStepProps {
  value: BuildingType | null;
  error?: string;
  onChange: (type: BuildingType) => void;
}

const GROUPS: { category: BuildingCategory; label: string }[] = [
  { category: "residential", label: "Homes" },
  { category: "commercial", label: "Businesses" },
];

/** Radio cards built on native radio inputs, so arrow keys and screen readers work as expected. */
export function BuildingTypeStep({ value, error, onChange }: BuildingTypeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <fieldset key={group.category} className="flex flex-col gap-3">
          <legend className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">{group.label}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BUILDING_TYPES.filter((type) => BUILDING_TYPE_INFO[type].category === group.category).map((type) => {
              const info = BUILDING_TYPE_INFO[type];
              const checked = value === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50",
                    "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    checked && "border-primary bg-primary-soft ring-1 ring-primary",
                  )}
                >
                  <input
                    type="radio"
                    name="building-type"
                    value={type}
                    checked={checked}
                    onChange={() => onChange(type)}
                    className="sr-only"
                  />
                  {checked && (
                    <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                  <BuildingTypeIcon type={type} className={cn("size-6", checked ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{info.label}</span>
                  <span className="text-xs text-muted-foreground">{info.description}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
