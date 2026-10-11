import { BUILDING_TYPE_INFO, type BuildingType } from "@/lib/domain/building";
import type { RoomKind } from "@/lib/domain/room";
import type { ScheduleTemplate } from "@/lib/domain/schedule";

export interface ItemTemplate {
  key: string;
  name: string;
  /** Room kinds where this item is suggested during onboarding. */
  suggestedIn: RoomKind[];
  /** Limit the suggestion to these building types. Omit to suggest everywhere. */
  onlyFor?: BuildingType[];
  schedules: ScheduleTemplate[];
}

const DETACHED: BuildingType[] = ["house", "rental", "mobile_home"];

const every = (count: number, unit: "day" | "week" | "month" | "year") =>
  ({ kind: "interval", count, unit }) as const;

/** Starter catalog, from the example maintenance plan in the Rookpilot doc. */
export const ITEM_TEMPLATES: ItemTemplate[] = [
  { key: "air_filter", name: "Air filter", suggestedIn: ["whole_building"], schedules: [{ title: "Replace", repeat: every(3, "month") }] },
  { key: "furnace", name: "Furnace", suggestedIn: ["whole_building"], onlyFor: DETACHED, schedules: [{ title: "Tune-up", repeat: { kind: "seasonal", seasons: ["fall"] } }] },
  { key: "ac", name: "Air conditioner", suggestedIn: ["whole_building"], onlyFor: DETACHED, schedules: [{ title: "Check", repeat: { kind: "seasonal", seasons: ["spring"] } }] },
  { key: "water_heater", name: "Water heater", suggestedIn: ["whole_building"], onlyFor: DETACHED, schedules: [{ title: "Flush", repeat: every(1, "year") }] },
  { key: "roof", name: "Roof", suggestedIn: ["whole_building"], onlyFor: DETACHED, schedules: [{ title: "Inspect", repeat: { kind: "seasonal", seasons: ["spring"] } }] },
  { key: "gutters", name: "Gutters", suggestedIn: ["whole_building"], onlyFor: DETACHED, schedules: [{ title: "Clean", repeat: { kind: "seasonal", seasons: ["spring", "fall"] } }] },
  {
    key: "smoke_alarm",
    name: "Smoke alarm",
    suggestedIn: ["bedroom", "hallway"],
    schedules: [
      { title: "Test", repeat: every(1, "month") },
      { title: "Battery", repeat: every(1, "year") },
      { title: "Replace", repeat: every(10, "year") },
    ],
  },
  {
    key: "co_alarm",
    name: "Carbon monoxide alarm",
    suggestedIn: ["hallway"],
    schedules: [
      { title: "Test", repeat: every(1, "month") },
      { title: "Replace", repeat: every(7, "year") },
    ],
  },
  { key: "exhaust_fan", name: "Exhaust fan", suggestedIn: ["bathroom"], schedules: [{ title: "Clean", repeat: every(1, "year") }] },
  { key: "caulk_grout", name: "Caulk and grout", suggestedIn: ["bathroom"], schedules: [{ title: "Check", repeat: every(1, "year") }] },
  { key: "under_sink_pipes", name: "Under-sink pipes", suggestedIn: ["bathroom"], schedules: [{ title: "Check for leaks", repeat: every(6, "month") }] },
  { key: "fridge_filter", name: "Fridge water filter", suggestedIn: ["kitchen"], schedules: [{ title: "Replace", repeat: every(6, "month") }] },
  { key: "dishwasher_filter", name: "Dishwasher filter", suggestedIn: ["kitchen"], schedules: [{ title: "Clean", repeat: every(1, "month") }] },
  { key: "range_hood_filter", name: "Range hood filter", suggestedIn: ["kitchen"], schedules: [{ title: "Clean", repeat: every(3, "month") }] },
  { key: "fire_extinguisher", name: "Fire extinguisher", suggestedIn: ["kitchen"], schedules: [{ title: "Check", repeat: every(1, "month") }] },
  { key: "dryer_vent", name: "Dryer vent", suggestedIn: ["laundry"], schedules: [{ title: "Clean", repeat: every(1, "year") }] },
  { key: "garage_door", name: "Garage door", suggestedIn: ["garage"], schedules: [{ title: "Lubricate", repeat: every(1, "year") }] },
  {
    key: "sprinklers",
    name: "Sprinklers",
    suggestedIn: ["garden"],
    schedules: [
      { title: "Turn on", repeat: { kind: "seasonal", seasons: ["spring"] } },
      { title: "Winterize", repeat: { kind: "seasonal", seasons: ["fall"] } },
    ],
  },
  { key: "garden_beds", name: "Garden beds", suggestedIn: ["garden"], schedules: [{ title: "Prune and mulch", repeat: { kind: "seasonal", seasons: ["spring"] } }] },
  { key: "outdoor_faucets", name: "Outdoor faucets", suggestedIn: ["garden"], schedules: [{ title: "Cover", repeat: { kind: "seasonal", seasons: ["winter"] } }] },
];

const TEMPLATES_BY_KEY = new Map(ITEM_TEMPLATES.map((t) => [t.key, t]));

export function getItemTemplate(key: string): ItemTemplate | undefined {
  return TEMPLATES_BY_KEY.get(key);
}

/** Commercial buildings get the basics in their whole-building space. */
const COMMERCIAL_BASICS = ["air_filter", "smoke_alarm", "fire_extinguisher"];

/** Templates to pre-select for a room of the given kind in a building of the given type. */
export function suggestItemTemplates(kind: RoomKind, buildingType: BuildingType | null): ItemTemplate[] {
  if (buildingType && BUILDING_TYPE_INFO[buildingType].category === "commercial") {
    if (kind !== "whole_building") return [];
    return COMMERCIAL_BASICS.map((key) => TEMPLATES_BY_KEY.get(key)).filter((t): t is ItemTemplate => Boolean(t));
  }
  return ITEM_TEMPLATES.filter(
    (t) => t.suggestedIn.includes(kind) && (!t.onlyFor || (buildingType !== null && t.onlyFor.includes(buildingType))),
  );
}
