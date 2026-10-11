import { describe, expect, it } from "vitest";

import { daysBetween } from "@/lib/dates";
import { getItemTemplate } from "@/lib/templates/items";

import { buildItems, type IdFactory } from "./builders";
import { dataReducer } from "./reducer";
import { createSampleData } from "./sample-data";

const TODAY = "2026-10-10";

function ids(): IdFactory {
  let n = 0;
  return () => `new-${++n}`;
}

describe("buildItems", () => {
  it("creates one item per unit, numbered, each with its own timers", () => {
    const { items, schedules } = buildItems(
      {
        buildingId: "b",
        spaceId: "s",
        name: "Smoke alarm",
        template: getItemTemplate("smoke_alarm") ?? null,
        count: 2,
        installedOn: null,
        hemisphere: "north",
        today: TODAY,
      },
      ids(),
    );
    expect(items.map((i) => i.name)).toEqual(["Smoke alarm 1", "Smoke alarm 2"]);
    expect(schedules).toHaveLength(6);
    expect(schedules.find((s) => s.title === "Battery")?.nextDueOn).toBe("2027-10-10");
  });

  it("counts from the install date when there is one", () => {
    const { schedules } = buildItems(
      {
        buildingId: "b",
        spaceId: "s",
        name: "Air filter",
        template: getItemTemplate("air_filter") ?? null,
        count: 1,
        installedOn: "2026-09-01",
        hemisphere: "north",
        today: TODAY,
      },
      ids(),
    );
    expect(schedules[0].nextDueOn).toBe("2026-12-01");
  });

  it("gives custom items no timers", () => {
    const { schedules } = buildItems(
      { buildingId: "b", spaceId: "s", name: "Attic fan", template: null, count: 1, installedOn: null, hemisphere: "north", today: TODAY },
      ids(),
    );
    expect(schedules).toEqual([]);
  });
});

describe("sample data", () => {
  it("matches the doc's example house: 26 items and 36 timers", () => {
    const data = createSampleData(TODAY);
    expect(data.items.filter((i) => i.buildingId === "elm")).toHaveLength(26);
    const elmItemIds = new Set(data.items.filter((i) => i.buildingId === "elm").map((i) => i.id));
    expect(data.schedules.filter((s) => elmItemIds.has(s.itemId))).toHaveLength(36);
  });

  it("has unique ids and a mix of overdue and upcoming timers", () => {
    const data = createSampleData(TODAY);
    const allIds = [...data.spaces, ...data.items, ...data.schedules].map((e) => e.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(data.schedules.some((s) => s.nextDueOn < TODAY)).toBe(true);
    expect(data.schedules.some((s) => s.nextDueOn > TODAY)).toBe(true);
  });

  it("keeps overdue sample timers no more than about a month late", () => {
    const data = createSampleData(TODAY);
    const latest = data.schedules.map((s) => daysBetween(s.nextDueOn, TODAY)).reduce((a, b) => Math.max(a, b), 0);
    expect(latest).toBeLessThanOrEqual(35);
  });
});

describe("dataReducer", () => {
  it("deletes a room's items and their timers along with the room", () => {
    const data = createSampleData(TODAY);
    const kitchen = data.spaces.find((s) => s.buildingId === "elm" && s.kind === "kitchen")!;
    const kitchenItemIds = new Set(data.items.filter((i) => i.spaceId === kitchen.id).map((i) => i.id));

    const next = dataReducer(data, { type: "deleteSpace", id: kitchen.id });
    expect(next.spaces.some((s) => s.id === kitchen.id)).toBe(false);
    expect(next.items.some((i) => kitchenItemIds.has(i.id))).toBe(false);
    expect(next.schedules.some((s) => kitchenItemIds.has(s.itemId))).toBe(false);
  });

  it("deletes an item's timers along with the item", () => {
    const data = createSampleData(TODAY);
    const item = data.items[0];
    const next = dataReducer(data, { type: "deleteItem", id: item.id });
    expect(next.schedules.some((s) => s.itemId === item.id)).toBe(false);
  });

  it("selects a newly added building and ignores unknown ids", () => {
    const data = createSampleData(TODAY);
    expect(dataReducer(data, { type: "selectBuilding", id: "missing" }).currentBuildingId).toBe("elm");
    expect(dataReducer(data, { type: "selectBuilding", id: "pearl" }).currentBuildingId).toBe("pearl");
  });
});
