import { describe, expect, it } from "vitest";

import { INITIAL_STATE, type OnboardingDraft } from "./state";
import { draftToBuilding } from "./to-building";

let n = 0;
const newId = () => `id-${++n}`;

const base: OnboardingDraft = {
  ...INITIAL_STATE.draft,
  address: { line1: "1428 Elm Street", line2: "", city: "Portland", region: "OR", postalCode: "97214", country: "United States" },
  buildingType: "house",
  basics: { name: "", beds: "3", baths: "2", yearBuilt: "1994", sqft: "" },
};

describe("draftToBuilding", () => {
  it("names the building after the street when no name was given and parses numbers", () => {
    const { building } = draftToBuilding(base, "2026-10-10", newId);
    expect(building.name).toBe("1428 Elm Street");
    expect(building).toMatchObject({ beds: 3, baths: 2, yearBuilt: 1994, sqft: null });
  });

  it("keeps a whole-building room when rooms were skipped", () => {
    const { spaces, items } = draftToBuilding(base, "2026-10-10", newId);
    expect(spaces.map((s) => s.kind)).toEqual(["whole_building"]);
    expect(items).toEqual([]);
  });

  it("creates selected items with their counts and timers, skipping unselected ones", () => {
    const draft: OnboardingDraft = {
      ...base,
      rooms: [{ id: "r1", name: "Hallway", kind: "hallway" }],
      items: [
        { id: "a", roomId: "r1", templateKey: "smoke_alarm", name: "Smoke alarm", count: 2, selected: true },
        { id: "b", roomId: "r1", templateKey: "co_alarm", name: "Carbon monoxide alarm", count: 1, selected: false },
      ],
    };
    const { spaces, items, schedules } = draftToBuilding(draft, "2026-10-10", newId);
    expect(items.map((i) => i.name)).toEqual(["Smoke alarm 1", "Smoke alarm 2"]);
    expect(items.every((i) => i.spaceId === spaces[0].id)).toBe(true);
    expect(schedules).toHaveLength(6);
  });

  it("refuses to build without a building type", () => {
    expect(() => draftToBuilding({ ...base, buildingType: null }, "2026-10-10", newId)).toThrow();
  });
});
