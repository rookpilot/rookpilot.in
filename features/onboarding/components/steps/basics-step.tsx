import { FormField } from "@/components/form/form-field";
import { BUILDING_TYPE_INFO, type BuildingBasics, type BuildingType } from "@/lib/domain/building";

import { BIG_INPUT } from "./field-styles";

interface BasicsStepProps {
  basics: BuildingBasics;
  buildingType: BuildingType | null;
  /** Shown as the name placeholder: what the building is called if the name is left blank. */
  fallbackName: string;
  onChange: (patch: Partial<BuildingBasics>) => void;
}

/** Keeps only digits, so number fields can't hold stray characters. */
const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function BasicsStep({ basics, buildingType, fallbackName, onChange }: BasicsStepProps) {
  const isResidential = buildingType === null || BUILDING_TYPE_INFO[buildingType].category === "residential";

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      <FormField
        inputClassName={BIG_INPUT}
        className="col-span-2 sm:col-span-4"
        label="Building name"
        hint={`Leave blank to use "${fallbackName}".`}
        placeholder={fallbackName}
        value={basics.name}
        onChange={(e) => onChange({ name: e.target.value })}
        autoFocus
      />
      {isResidential && (
        <>
          <FormField
            inputClassName={BIG_INPUT}
            label="Bedrooms"
            inputMode="numeric"
            value={basics.beds}
            onChange={(e) => onChange({ beds: digitsOnly(e.target.value) })}
          />
          <FormField
            inputClassName={BIG_INPUT}
            label="Bathrooms"
            inputMode="numeric"
            value={basics.baths}
            onChange={(e) => onChange({ baths: digitsOnly(e.target.value) })}
          />
        </>
      )}
      <FormField
        inputClassName={BIG_INPUT}
        label="Year built"
        inputMode="numeric"
        maxLength={4}
        placeholder="1994"
        value={basics.yearBuilt}
        onChange={(e) => onChange({ yearBuilt: digitsOnly(e.target.value) })}
      />
      <FormField
        inputClassName={BIG_INPUT}
        label="Size (sq ft)"
        inputMode="numeric"
        placeholder="1850"
        value={basics.sqft}
        onChange={(e) => onChange({ sqft: digitsOnly(e.target.value) })}
      />
    </div>
  );
}
