export const STEP_IDS = ["address", "type", "basics", "rooms", "items"] as const;

export type StepId = (typeof STEP_IDS)[number];

export interface StepConfig {
  id: StepId;
  /** Short name for the step list. */
  label: string;
  title: string;
  description: string;
  optional: boolean;
}

export const STEPS: StepConfig[] = [
  {
    id: "address",
    label: "Address",
    title: "Where is the building?",
    description: "Enter the address. Autofill from the address comes later.",
    optional: false,
  },
  {
    id: "type",
    label: "Building type",
    title: "What kind of building is it?",
    description: "This decides which rooms and items we suggest.",
    optional: false,
  },
  {
    id: "basics",
    label: "Basics",
    title: "A few details",
    description: "All of these are optional. Beds and baths help suggest rooms.",
    optional: true,
  },
  {
    id: "rooms",
    label: "Rooms",
    title: "Which rooms does it have?",
    description: "We suggested a list. Rename, remove, or add rooms. You can change these later.",
    optional: true,
  },
  {
    id: "items",
    label: "Items",
    title: "What should we keep track of?",
    description: "Each item gets its own maintenance timers. Four smoke alarms means four timers of each kind.",
    optional: true,
  },
];

export const LAST_STEP_INDEX = STEPS.length - 1;
