import type { Address, BuildingBasics, BuildingType } from "@/lib/domain/building";
import type { RoomKind } from "@/lib/domain/room";

import { LAST_STEP_INDEX } from "./steps";

export interface RoomDraft {
  id: string;
  name: string;
  kind: RoomKind;
}

export interface ItemDraft {
  id: string;
  roomId: string;
  /** Null for a custom item the user typed in. */
  templateKey: string | null;
  name: string;
  count: number;
  selected: boolean;
}

export interface OnboardingDraft {
  address: Address;
  buildingType: BuildingType | null;
  basics: BuildingBasics;
  rooms: RoomDraft[];
  items: ItemDraft[];
  /** True once rooms have been suggested, so revisiting the step keeps the user's edits. */
  roomsSeeded: boolean;
  /** Rooms whose suggested items were already added. */
  itemsSeededFor: string[];
}

export interface OnboardingState {
  stepIndex: number;
  /** Highest step reached, so the step list knows which steps can be revisited. */
  furthestIndex: number;
  /** Show validation errors only after the user tries to continue. */
  showErrors: boolean;
  draft: OnboardingDraft;
}

export const EMPTY_ADDRESS: Address = { line1: "", line2: "", city: "", region: "", postalCode: "", country: "United States" };
export const EMPTY_BASICS: BuildingBasics = { name: "", beds: "", baths: "", yearBuilt: "", sqft: "" };

export const INITIAL_STATE: OnboardingState = {
  stepIndex: 0,
  furthestIndex: 0,
  showErrors: false,
  draft: {
    address: EMPTY_ADDRESS,
    buildingType: null,
    basics: EMPTY_BASICS,
    rooms: [],
    items: [],
    roomsSeeded: false,
    itemsSeededFor: [],
  },
};

export type OnboardingAction =
  | { type: "reset" }
  | { type: "goTo"; index: number }
  | { type: "showErrors" }
  | { type: "updateAddress"; patch: Partial<Address> }
  | { type: "setBuildingType"; buildingType: BuildingType }
  | { type: "updateBasics"; patch: Partial<BuildingBasics> }
  | { type: "clearBasics" }
  | { type: "setRooms"; rooms: RoomDraft[] }
  | { type: "addRoom"; room: RoomDraft }
  | { type: "updateRoom"; id: string; patch: Partial<Omit<RoomDraft, "id">> }
  | { type: "removeRoom"; id: string }
  | { type: "seedItems"; items: ItemDraft[]; roomIds: string[] }
  | { type: "addItem"; item: ItemDraft }
  | { type: "updateItem"; id: string; patch: Partial<Pick<ItemDraft, "count" | "selected" | "name">> }
  | { type: "removeItem"; id: string };

function updateDraft(state: OnboardingState, patch: Partial<OnboardingDraft>): OnboardingState {
  return { ...state, draft: { ...state.draft, ...patch } };
}

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  const { draft } = state;

  switch (action.type) {
    case "reset":
      return INITIAL_STATE;
    case "goTo": {
      const index = Math.max(0, Math.min(action.index, LAST_STEP_INDEX));
      return { ...state, stepIndex: index, furthestIndex: Math.max(state.furthestIndex, index), showErrors: false };
    }
    case "showErrors":
      return { ...state, showErrors: true };

    case "updateAddress":
      return updateDraft(state, { address: { ...draft.address, ...action.patch } });
    case "setBuildingType":
      return updateDraft(state, { buildingType: action.buildingType });
    case "updateBasics":
      return updateDraft(state, { basics: { ...draft.basics, ...action.patch } });
    case "clearBasics":
      return updateDraft(state, { basics: EMPTY_BASICS });

    case "setRooms":
      // Replacing the rooms also drops items for rooms that no longer exist.
      return updateDraft(state, {
        rooms: action.rooms,
        roomsSeeded: true,
        items: draft.items.filter((item) => action.rooms.some((room) => room.id === item.roomId)),
        itemsSeededFor: draft.itemsSeededFor.filter((id) => action.rooms.some((room) => room.id === id)),
      });
    case "addRoom":
      return updateDraft(state, { rooms: [...draft.rooms, action.room] });
    case "updateRoom":
      return updateDraft(state, {
        rooms: draft.rooms.map((room) => (room.id === action.id ? { ...room, ...action.patch } : room)),
      });
    case "removeRoom":
      return updateDraft(state, {
        rooms: draft.rooms.filter((room) => room.id !== action.id),
        items: draft.items.filter((item) => item.roomId !== action.id),
        itemsSeededFor: draft.itemsSeededFor.filter((id) => id !== action.id),
      });

    case "seedItems":
      return updateDraft(state, {
        items: [...draft.items, ...action.items],
        itemsSeededFor: [...draft.itemsSeededFor, ...action.roomIds],
      });
    case "addItem":
      return updateDraft(state, { items: [...draft.items, action.item] });
    case "updateItem":
      return updateDraft(state, {
        items: draft.items.map((item) => (item.id === action.id ? { ...item, ...action.patch } : item)),
      });
    case "removeItem":
      return updateDraft(state, { items: draft.items.filter((item) => item.id !== action.id) });
  }
}
