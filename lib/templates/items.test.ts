import { describe, expect, it } from "vitest";

import { ITEM_TEMPLATES, suggestItemTemplates } from "./items";

const keys = (...args: Parameters<typeof suggestItemTemplates>) => suggestItemTemplates(...args).map((t) => t.key);

describe("item templates", () => {
  it("have unique keys and at least one schedule each", () => {
    const allKeys = ITEM_TEMPLATES.map((t) => t.key);
    expect(new Set(allKeys).size).toBe(allKeys.length);
    for (const template of ITEM_TEMPLATES) expect(template.schedules.length).toBeGreaterThan(0);
  });

  it("gives a smoke alarm three timers", () => {
    const smoke = ITEM_TEMPLATES.find((t) => t.key === "smoke_alarm");
    expect(smoke?.schedules.map((s) => s.title)).toEqual(["Test", "Battery", "Replace"]);
  });
});

describe("suggestItemTemplates", () => {
  it("suggests smoke and CO alarms for a hallway", () => {
    expect(keys("hallway", "house")).toEqual(["smoke_alarm", "co_alarm"]);
  });

  it("skips roof and gutters for an apartment", () => {
    const apartment = keys("whole_building", "apartment_condo");
    expect(apartment).toEqual(["air_filter"]);
    expect(keys("whole_building", "house")).toContain("gutters");
  });

  it("gives commercial buildings only the basics, in the whole-building room", () => {
    expect(keys("whole_building", "gym")).toEqual(["air_filter", "smoke_alarm", "fire_extinguisher"]);
    expect(keys("kitchen", "store_cafe")).toEqual([]);
  });
});
