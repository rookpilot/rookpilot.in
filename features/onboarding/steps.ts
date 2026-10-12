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
    description: "Start with the address. You can change it any time.",
    optional: false,
  },
  {
    id: "type",
    label: "Building type",
    title: "What kind of building is it?",
    description: "We use this to suggest rooms and the things worth tracking.",
    optional: false,
  },
  {
    id: "basics",
    label: "Basics",
    title: "A few details",
    description: "Beds and baths help us suggest rooms. Fill in what you know.",
    optional: true,
  },
  {
    id: "rooms",
    label: "Rooms",
    title: "Which rooms does it have?",
    description: "Here's a starting list. Rename, remove, or add rooms.",
    optional: true,
  },
  {
    id: "items",
    label: "Items",
    title: "What should we keep track of?",
    description: "Each item gets its own maintenance timers. Uncheck anything you don't have.",
    optional: true,
  },
];

export const LAST_STEP_INDEX = STEPS.length - 1;
