import type { Address, BuildingType } from "./building";
import type { RoomKind } from "./room";
import type { RepeatRule } from "./schedule";

/** A calendar date with no time or zone, like "2026-10-10". */
export type ISODate = string;

export type Hemisphere = "north" | "south";

export interface Building {
  id: string;
  name: string;
  type: BuildingType;
  address: Address;
  beds: number | null;
  baths: number | null;
  yearBuilt: number | null;
  sqft: number | null;
  hemisphere: Hemisphere;
}

/** A room or area. Called "space" in data so it also fits a lobby, a yard, or the whole building. */
export interface Space {
  id: string;
  buildingId: string;
  name: string;
  kind: RoomKind;
}

export interface Item {
  id: string;
  buildingId: string;
  spaceId: string;
  name: string;
  /** Null for a custom item. */
  templateKey: string | null;
  brand: string;
  model: string;
  installedOn: ISODate | null;
  notes: string;
}

export interface Schedule {
  id: string;
  itemId: string;
  title: string;
  repeat: RepeatRule;
  lastDoneOn: ISODate | null;
  nextDueOn: ISODate;
  /** Paused schedules keep their dates but don't show up as due. */
  active: boolean;
}
