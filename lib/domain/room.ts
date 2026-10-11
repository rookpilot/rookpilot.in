export const ROOM_KINDS = [
  "whole_building",
  "bedroom",
  "bathroom",
  "kitchen",
  "living",
  "hallway",
  "laundry",
  "garage",
  "garden",
  "other",
] as const;

export type RoomKind = (typeof ROOM_KINDS)[number];

export const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  whole_building: "Whole building",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  living: "Living area",
  hallway: "Hallway",
  laundry: "Laundry",
  garage: "Garage",
  garden: "Garden or yard",
  other: "Other",
};
