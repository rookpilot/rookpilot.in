import { describe, expect, it } from "vitest";

import { resolveBuildingName, summarize, validateStep } from "./selectors";
import { INITIAL_STATE, type OnboardingDraft } from "./state";

const draft = (patch: Partial<OnboardingDraft> = {}): OnboardingDraft => ({ ...INITIAL_STATE.draft, ...patch });

describe("validateStep", () => {
  it("requires street, city, state, and ZIP but not the unit", () => {
    expect(Object.keys(validateStep("address", draft()))).toEqual(["line1", "city", "region", "postalCode"]);
    const filled = draft({
      address: { line1: "1428 Elm Street", line2: "", city: "Portland", region: "OR", postalCode: "97214", country: "United States" },
    });
    expect(validateStep("address", filled)).toEqual({});
  });

  it("requires a building type", () => {
    expect(validateStep("type", draft())).toHaveProperty("buildingType");
    expect(validateStep("type", draft({ buildingType: "house" }))).toEqual({});
  });

  it("flags rooms without a name", () => {
    const errors = validateStep("rooms", draft({ rooms: [{ id: "r1", name: " ", kind: "other" }] }));
    expect(errors).toHaveProperty("r1");
  });

  it("never blocks the optional basics and items steps", () => {
    expect(validateStep("basics", draft())).toEqual({});
    expect(validateStep("items", draft())).toEqual({});
  });
});

describe("resolveBuildingName", () => {
  it("prefers the typed name, then the street address", () => {
    const address = { ...INITIAL_STATE.draft.address, line1: "1428 Elm Street" };
    expect(resolveBuildingName(draft({ address, basics: { ...INITIAL_STATE.draft.basics, name: "Elm house" } }))).toBe("Elm house");
    expect(resolveBuildingName(draft({ address }))).toBe("1428 Elm Street");
    expect(resolveBuildingName(draft())).toBe("My building");
  });
});

describe("summarize", () => {
  it("counts each unit's timers and ignores unselected items", () => {
    const totals = summarize(
      draft({
        rooms: [{ id: "r1", name: "Hallway", kind: "hallway" }],
        items: [
          { id: "a", roomId: "r1", templateKey: "smoke_alarm", name: "Smoke alarm", count: 4, selected: true },
          { id: "b", roomId: "r1", templateKey: "co_alarm", name: "CO alarm", count: 1, selected: false },
          { id: "c", roomId: "r1", templateKey: null, name: "Attic fan", count: 1, selected: true },
        ],
      }),
    );
    expect(totals).toEqual({ rooms: 1, items: 5, timers: 12 });
  });
});
