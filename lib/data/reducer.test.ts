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

  it("tags only real contacts and links the house's work to its rooms", () => {
    const data = createSampleData(TODAY);
    const contactIds = new Set(data.contacts.map((c) => c.id));
    const tags = [...data.logs, ...data.work].flatMap((entry) => entry.contactIds);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((id) => contactIds.has(id))).toBe(true);
    expect(data.work.every((w) => w.spaceId !== null)).toBe(true);
  });

  it("logs each recent completion once", () => {
    const data = createSampleData(TODAY);
    expect(data.logs.length).toBeGreaterThan(20);
    expect(data.logs.every((log) => log.doneOn <= TODAY)).toBe(true);
    expect(new Set(data.logs.map((log) => log.scheduleId)).size).toBe(data.logs.length);
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

  it("keeps work in a deleted room but unlinks it", () => {
    const data = createSampleData(TODAY);
    const garage = data.work.find((w) => w.id === "work-garage-door")!;
    const next = dataReducer(data, { type: "deleteSpace", id: garage.spaceId! });
    expect(next.work.find((w) => w.id === garage.id)).toMatchObject({ spaceId: null, itemId: null });
  });

  it("deletes an item's timers and history along with the item", () => {
    const data = createSampleData(TODAY);
    const item = data.items[0];
    expect(data.logs.some((log) => log.itemId === item.id)).toBe(true);
    const next = dataReducer(data, { type: "deleteItem", id: item.id });
    expect(next.schedules.some((s) => s.itemId === item.id)).toBe(false);
    expect(next.logs.some((log) => log.itemId === item.id)).toBe(false);
  });

  it("moves linked work with an item to its new room", () => {
    const data = createSampleData(TODAY);
    const garage = data.work.find((w) => w.id === "work-garage-door")!;
    const kitchen = data.spaces.find((s) => s.buildingId === "elm" && s.kind === "kitchen")!;
    const next = dataReducer(data, { type: "updateItem", id: garage.itemId!, patch: { spaceId: kitchen.id } });
    expect(next.work.find((w) => w.id === garage.id)?.spaceId).toBe(kitchen.id);
  });

  it("keeps history when a timer is deleted", () => {
    const data = createSampleData(TODAY);
    const log = data.logs[0];
    const next = dataReducer(data, { type: "deleteSchedule", id: log.scheduleId! });
    expect(next.logs.find((l) => l.id === log.id)?.scheduleId).toBeNull();
  });

  it("logs a completion and moves the timer in one step", () => {
    const data = createSampleData(TODAY);
    const schedule = data.schedules[0];
    const item = data.items.find((i) => i.id === schedule.itemId)!;
    const next = dataReducer(data, {
      type: "completeSchedules",
      completions: [
        {
          log: { id: "done-1", buildingId: "elm", itemId: item.id, scheduleId: schedule.id, title: schedule.title, doneOn: TODAY, note: "", cost: 6, contactIds: [] },
          lastDoneOn: TODAY,
          nextDueOn: "2027-01-10",
        },
      ],
    });
    expect(next.logs.at(-1)?.id).toBe("done-1");
    expect(next.schedules[0]).toMatchObject({ lastDoneOn: TODAY, nextDueOn: "2027-01-10" });
  });

  it("removes a deleted contact's tags but keeps the work", () => {
    const data = createSampleData(TODAY);
    const next = dataReducer(data, { type: "deleteContact", id: "contact-dana" });
    expect(next.contacts.some((c) => c.id === "contact-dana")).toBe(false);
    expect(next.work).toHaveLength(data.work.length);
    expect([...next.work, ...next.logs].some((entry) => entry.contactIds.includes("contact-dana"))).toBe(false);
  });

  it("deletes a building with everything in it and selects another", () => {
    const data = createSampleData(TODAY);
    const next = dataReducer(data, { type: "deleteBuilding", id: "elm" });
    expect(next.currentBuildingId).toBe("pearl");
    for (const list of [next.spaces, next.items, next.logs, next.work]) {
      expect(list.some((entry) => entry.buildingId === "elm")).toBe(false);
    }
    const itemIds = new Set(next.items.map((i) => i.id));
    expect(next.schedules.every((s) => itemIds.has(s.itemId))).toBe(true);
    expect(next.contacts).toHaveLength(data.contacts.length);

    expect(dataReducer(next, { type: "deleteBuilding", id: "pearl" }).currentBuildingId).toBeNull();
  });

  it("selects a newly added building and ignores unknown ids", () => {
    const data = createSampleData(TODAY);
    expect(dataReducer(data, { type: "selectBuilding", id: "missing" }).currentBuildingId).toBe("elm");
    expect(dataReducer(data, { type: "selectBuilding", id: "pearl" }).currentBuildingId).toBe("pearl");
  });
});
