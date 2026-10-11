import type { Address } from "@/lib/domain/building";
import { getItemTemplate } from "@/lib/templates/items";

import type { OnboardingDraft } from "./state";
import type { StepId } from "./steps";

export type StepErrors = Record<string, string>;

const REQUIRED_ADDRESS_FIELDS: { field: keyof Address; message: string }[] = [
  { field: "line1", message: "Enter the street address." },
  { field: "city", message: "Enter the city." },
  { field: "region", message: "Enter the state or region." },
  { field: "postalCode", message: "Enter the ZIP or postal code." },
  { field: "country", message: "Enter the country." },
];

function validateAddress(address: Address): StepErrors {
  const errors: StepErrors = {};
  for (const { field, message } of REQUIRED_ADDRESS_FIELDS) {
    if (!address[field].trim()) errors[field] = message;
  }
  return errors;
}

function validateRooms(draft: OnboardingDraft): StepErrors {
  const errors: StepErrors = {};
  for (const room of draft.rooms) {
    if (!room.name.trim()) errors[room.id] = "Give this room a name.";
  }
  return errors;
}

/** Errors that block "Next" on the given step. Optional steps only fail on half-filled input. */
export function validateStep(step: StepId, draft: OnboardingDraft): StepErrors {
  switch (step) {
    case "address":
      return validateAddress(draft.address);
    case "type":
      return draft.buildingType ? {} : { buildingType: "Pick the type that fits best." };
    case "rooms":
      return validateRooms(draft);
    default:
      return {};
  }
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The building's display name: what the user typed, or the street address. */
export function resolveBuildingName(draft: OnboardingDraft): string {
  return draft.basics.name.trim() || draft.address.line1.trim() || "My building";
}

export interface OnboardingTotals {
  rooms: number;
  items: number;
  timers: number;
}

/** Counts for the summary: each unit of an item gets its own copy of every timer. */
export function summarize(draft: OnboardingDraft): OnboardingTotals {
  let items = 0;
  let timers = 0;
  for (const item of draft.items) {
    if (!item.selected) continue;
    items += item.count;
    const schedules = item.templateKey ? (getItemTemplate(item.templateKey)?.schedules.length ?? 0) : 0;
    timers += item.count * schedules;
  }
  return { rooms: draft.rooms.length, items, timers };
}
