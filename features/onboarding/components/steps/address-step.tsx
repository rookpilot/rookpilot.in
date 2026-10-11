import { FormField } from "@/components/form/form-field";
import type { Address } from "@/lib/domain/building";

import type { StepErrors } from "../../selectors";

interface AddressStepProps {
  address: Address;
  errors: StepErrors;
  onChange: (patch: Partial<Address>) => void;
}

export function AddressStep({ address, errors, onChange }: AddressStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <FormField
        className="sm:col-span-6"
        label="Street address"
        autoComplete="address-line1"
        placeholder="1428 Elm Street"
        value={address.line1}
        error={errors.line1}
        onChange={(e) => onChange({ line1: e.target.value })}
        autoFocus
      />
      <FormField
        className="sm:col-span-6"
        label="Apartment, suite, or unit"
        optional
        autoComplete="address-line2"
        value={address.line2}
        onChange={(e) => onChange({ line2: e.target.value })}
      />
      <FormField
        className="sm:col-span-3"
        label="City"
        autoComplete="address-level2"
        value={address.city}
        error={errors.city}
        onChange={(e) => onChange({ city: e.target.value })}
      />
      <FormField
        className="sm:col-span-1"
        label="State"
        autoComplete="address-level1"
        value={address.region}
        error={errors.region}
        onChange={(e) => onChange({ region: e.target.value })}
      />
      <FormField
        className="sm:col-span-2"
        label="ZIP code"
        autoComplete="postal-code"
        inputMode="numeric"
        value={address.postalCode}
        error={errors.postalCode}
        onChange={(e) => onChange({ postalCode: e.target.value })}
      />
      <FormField
        className="sm:col-span-6"
        label="Country"
        autoComplete="country-name"
        value={address.country}
        error={errors.country}
        onChange={(e) => onChange({ country: e.target.value })}
      />
    </div>
  );
}
