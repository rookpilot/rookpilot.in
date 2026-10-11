"use client";

import { useState } from "react";

import { FormField } from "@/components/form/form-field";
import { SelectField } from "@/components/form/select-field";
import { Button } from "@/components/ui/button";
import { BUILDING_TYPE_INFO, BUILDING_TYPES, validateAddress, type Address, type BuildingType } from "@/lib/domain/building";
import type { Building, Hemisphere } from "@/lib/domain/models";

import type { BuildingForm as BuildingFormValues } from "../actions";

interface BuildingFormProps {
  building: Building;
  onSave: (form: BuildingFormValues) => void;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");
const toInput = (value: number | null) => (value === null ? "" : String(value));
const toNumber = (value: string) => (value === "" ? null : Number(value));

/** Edits a building's name, type, address, and basics. Render with key={building.id} so switching buildings resets it. */
export function BuildingForm({ building, onSave }: BuildingFormProps) {
  const [name, setName] = useState(building.name);
  const [type, setType] = useState<BuildingType>(building.type);
  const [address, setAddress] = useState<Address>(building.address);
  const [hemisphere, setHemisphere] = useState<Hemisphere>(building.hemisphere);
  const [basics, setBasics] = useState({
    beds: toInput(building.beds),
    baths: toInput(building.baths),
    yearBuilt: toInput(building.yearBuilt),
    sqft: toInput(building.sqft),
  });
  const [showErrors, setShowErrors] = useState(false);
  const [saved, setSaved] = useState(false);

  const errors = validateAddress(address);
  const nameError = name.trim() ? undefined : "Give the building a name.";
  const shown = showErrors ? errors : {};
  const setAddr = (patch: Partial<Address>) => {
    setAddress((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };
  const touch = () => setSaved(false);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onChange={touch}
      onSubmit={(event) => {
        event.preventDefault();
        if (nameError || Object.keys(errors).length > 0) {
          setShowErrors(true);
          return;
        }
        onSave({
          name,
          type,
          address,
          hemisphere,
          beds: toNumber(basics.beds),
          baths: toNumber(basics.baths),
          yearBuilt: toNumber(basics.yearBuilt),
          sqft: toNumber(basics.sqft),
        });
        setShowErrors(false);
        setSaved(true);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Name" value={name} error={showErrors ? nameError : undefined} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as BuildingType)}>
          {BUILDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {BUILDING_TYPE_INFO[t].label}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-bold">Address</legend>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <FormField label="Street address" autoComplete="address-line1" value={address.line1} error={shown.line1} onChange={(e) => setAddr({ line1: e.target.value })} />
          <FormField label="Apt, suite, unit" optional autoComplete="address-line2" value={address.line2} onChange={(e) => setAddr({ line2: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FormField label="City" autoComplete="address-level2" value={address.city} error={shown.city} onChange={(e) => setAddr({ city: e.target.value })} />
          <FormField label="State" autoComplete="address-level1" value={address.region} error={shown.region} onChange={(e) => setAddr({ region: e.target.value })} />
          <FormField label="ZIP code" autoComplete="postal-code" value={address.postalCode} error={shown.postalCode} onChange={(e) => setAddr({ postalCode: e.target.value })} />
          <FormField label="Country" autoComplete="country-name" value={address.country} error={shown.country} onChange={(e) => setAddr({ country: e.target.value })} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-bold">Basics</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FormField label="Bedrooms" optional inputMode="numeric" value={basics.beds} onChange={(e) => setBasics((b) => ({ ...b, beds: digitsOnly(e.target.value) }))} />
          <FormField label="Bathrooms" optional inputMode="numeric" value={basics.baths} onChange={(e) => setBasics((b) => ({ ...b, baths: digitsOnly(e.target.value) }))} />
          <FormField label="Year built" optional inputMode="numeric" maxLength={4} value={basics.yearBuilt} onChange={(e) => setBasics((b) => ({ ...b, yearBuilt: digitsOnly(e.target.value) }))} />
          <FormField label="Square feet" optional inputMode="numeric" value={basics.sqft} onChange={(e) => setBasics((b) => ({ ...b, sqft: digitsOnly(e.target.value) }))} />
        </div>
        <SelectField
          label="Hemisphere"
          className="sm:max-w-xs"
          value={hemisphere}
          onChange={(e) => setHemisphere(e.target.value as Hemisphere)}
        >
          <option value="north">Northern (spring starts in March)</option>
          <option value="south">Southern (spring starts in September)</option>
        </SelectField>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        <p className="text-sm text-ok" role="status">
          {saved ? "Saved." : ""}
        </p>
      </div>
    </form>
  );
}
