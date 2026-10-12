import { Check } from "lucide-react";

import { BuildingTypeIcon } from "@/components/building-type-icon";
import { BUILDING_TYPE_INFO, BUILDING_TYPES, type BuildingCategory, type BuildingType } from "@/lib/domain/building";
import { cn } from "@/lib/utils";

interface BuildingTypeStepProps {
  value: BuildingType | null;
  error?: string;
  onChange: (type: BuildingType) => void;
}

const GROUPS: { category: BuildingCategory; label: string }[] = [
  { category: "residential", label: "Homes" },
  { category: "commercial", label: "Businesses" },
];

/** Tiles built on native radio inputs, so arrow keys and screen readers work as expected. */
export function BuildingTypeStep({ value, error, onChange }: BuildingTypeStepProps) {
  return (
    <div className="flex flex-col gap-8">
      {GROUPS.map((group) => (
        <fieldset key={group.category} className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-muted-foreground">{group.label}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BUILDING_TYPES.filter((type) => BUILDING_TYPE_INFO[type].category === group.category).map((type) => {
              const info = BUILDING_TYPE_INFO[type];
              const checked = value === type;
              return (
                <label
                  key={type}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-3 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-border/70 transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    checked && "shadow-md ring-2 ring-foreground",
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
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl bg-muted transition-colors",
                      checked && "bg-foreground text-background",
                    )}
                  >
                    <BuildingTypeIcon type={type} className="size-5" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{info.label}</span>
                    <span className="text-xs text-muted-foreground">{info.description}</span>
                  </span>
                  <span
                    className={cn(
                      "absolute top-3 right-3 flex size-5 scale-50 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-all duration-200",
                      checked && "scale-100 opacity-100",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="size-3" />
                  </span>
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
