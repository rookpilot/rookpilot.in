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

/** One completion of a timer: the History entry "Mark done" creates. */
export interface LogEntry {
  id: string;
  buildingId: string;
  itemId: string;
  /** Null when the timer was deleted after it was done. */
  scheduleId: string | null;
  /** The task's title when it was done, so renaming the timer later doesn't rewrite history. */
  title: string;
  doneOn: ISODate;
  note: string;
  cost: number | null;
  /** Contacts who helped. */
  contactIds: string[];
}

/** Someone who helps keep your buildings running. Contacts belong to the account, not one building. */
export interface Contact {
  id: string;
  name: string;
  company: string;
  trade: string;
  phone: string;
  email: string;
  /** Handle without the @. */
  instagram: string;
  /** An uploaded photo as a data URL, or null to show initials. */
  photoUrl: string | null;
  whyWeLikeThem: string;
}

export type WorkKind = "project" | "repair";
export type ProjectStatus = "idea" | "planning" | "in_progress" | "done";
export type RepairStatus = "open" | "in_progress" | "fixed";
export type WorkStatus = ProjectStatus | RepairStatus;
export type PerformedBy = "diy" | "hired";

/** A project (adds or improves something) or a repair (fixes something that broke). */
export interface Work {
  id: string;
  buildingId: string;
  kind: WorkKind;
  title: string;
  status: WorkStatus;
  spaceId: string | null;
  itemId: string | null;
  performedBy: PerformedBy;
  cost: number | null;
  /** Projects only. */
  budget: number | null;
  /** When a repair was reported, or a project started. */
  startedOn: ISODate | null;
  /** When a repair is scheduled, or a project's target date. Shows on the calendar. */
  plannedOn: ISODate | null;
  /** Set when the status becomes done or fixed. */
  finishedOn: ISODate | null;
  notes: string;
  contactIds: string[];
}
