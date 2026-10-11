import { describe, expect, it } from "vitest";

import { INITIAL_STATE, onboardingReducer, type ItemDraft, type OnboardingState, type RoomDraft } from "./state";
import { LAST_STEP_INDEX } from "./steps";

const room = (id: string, name = id): RoomDraft => ({ id, name, kind: "other" });
const item = (id: string, roomId: string): ItemDraft => ({
  id,
  roomId,
  templateKey: null,
  name: id,
  count: 1,
  selected: true,
});

function withRoomsAndItems(): OnboardingState {
  let state = onboardingReducer(INITIAL_STATE, { type: "setRooms", rooms: [room("a"), room("b")] });
  state = onboardingReducer(state, { type: "seedItems", items: [item("i1", "a"), item("i2", "b")], roomIds: ["a", "b"] });
  return state;
}

describe("onboardingReducer", () => {
  it("clamps navigation and remembers the furthest step", () => {
    let state = onboardingReducer(INITIAL_STATE, { type: "goTo", index: 3 });
    expect(state.furthestIndex).toBe(3);
    state = onboardingReducer(state, { type: "goTo", index: 1 });
    expect(state.stepIndex).toBe(1);
    expect(state.furthestIndex).toBe(3);
    expect(onboardingReducer(state, { type: "goTo", index: 99 }).stepIndex).toBe(LAST_STEP_INDEX);
    expect(onboardingReducer(state, { type: "goTo", index: -1 }).stepIndex).toBe(0);
  });

  it("hides errors again after moving to another step", () => {
    const state = onboardingReducer(INITIAL_STATE, { type: "showErrors" });
    expect(onboardingReducer(state, { type: "goTo", index: 1 }).showErrors).toBe(false);
  });

  it("removes a room's items along with the room", () => {
    const state = onboardingReducer(withRoomsAndItems(), { type: "removeRoom", id: "a" });
    expect(state.draft.rooms.map((r) => r.id)).toEqual(["b"]);
    expect(state.draft.items.map((i) => i.id)).toEqual(["i2"]);
    expect(state.draft.itemsSeededFor).toEqual(["b"]);
  });

  it("drops items for rooms that disappear when rooms are replaced", () => {
    const state = onboardingReducer(withRoomsAndItems(), { type: "setRooms", rooms: [room("b"), room("c")] });
    expect(state.draft.items.map((i) => i.id)).toEqual(["i2"]);
    expect(state.draft.itemsSeededFor).toEqual(["b"]);
  });

  it("clears rooms and items when rooms are skipped", () => {
    const state = onboardingReducer(withRoomsAndItems(), { type: "clearRooms" });
    expect(state.draft.rooms).toEqual([]);
    expect(state.draft.items).toEqual([]);
    expect(state.draft.roomsSeeded).toBe(false);
  });

  it("unselects every item when items are skipped", () => {
    const state = onboardingReducer(withRoomsAndItems(), { type: "clearItems" });
    expect(state.draft.items.every((i) => !i.selected)).toBe(true);
  });

  it("returns to a blank wizard on reset", () => {
    expect(onboardingReducer(withRoomsAndItems(), { type: "reset" })).toEqual(INITIAL_STATE);
  });
});
