import { describe, expect, it } from "vitest";

import type { Building, Item, Schedule, Work } from "@/lib/domain/models";

import { buildingFromRow, buildingToRow, itemFromRow, itemToRow, scheduleFromRow, scheduleToRow, workFromRow, workToRow } from "./rows";

const building: Building = {
  id: "b1",
  name: "Elm Street house",
  type: "house",
  address: { line1: "1428 Elm Street", line2: "", city: "Portland", region: "OR", postalCode: "97214", country: "US" },
  beds: 3,
  baths: 2,
  yearBuilt: 1994,
  sqft: 1850,
  hemisphere: "north",
};

describe("rows", () => {
  it("round-trips a building through its flat row", () => {
    const row = buildingToRow(building);
    expect(row.postal_code).toBe("97214");
    expect(buildingFromRow({ ...row, created_at: "", created_by: null } as never)).toEqual(building);
  });

  it("only sends the columns a patch changes", () => {
    expect(buildingToRow({ name: "New name" })).toEqual({ name: "New name" });
    expect(itemToRow({ installedOn: null })).toEqual({ installed_on: null });
  });

  it("round-trips an item", () => {
    const item: Item = { id: "i1", buildingId: "b1", spaceId: "s1", name: "Air filter", templateKey: "air_filter", brand: "", model: "", installedOn: "2024-01-05", notes: "" };
    expect(itemFromRow({ ...itemToRow(item), created_at: "" } as never)).toEqual(item);
  });

  it("adds the building to a timer, which the app doesn't store on it", () => {
    const schedule: Schedule = { id: "t1", itemId: "i1", title: "Replace", repeat: { kind: "interval", count: 3, unit: "month" }, lastDoneOn: null, nextDueOn: "2026-12-01", active: true };
    const row = scheduleToRow(schedule, "b1");
    expect(row.building_id).toBe("b1");
    expect(scheduleFromRow({ ...row, created_at: "" } as never)).toEqual(schedule);
  });

  it("reads tags from the joined table and leaves them out when saving", () => {
    const work: Work = {
      id: "w1",
      buildingId: "b1",
      kind: "repair",
      title: "Leak",
      status: "open",
      spaceId: null,
      itemId: null,
      performedBy: "hired",
      cost: 150,
      budget: null,
      startedOn: "2026-11-01",
      plannedOn: null,
      finishedOn: null,
      notes: "",
      contactIds: ["c1", "c2"],
    };
    const row = workToRow(work);
    expect(row).not.toHaveProperty("contactIds");
    expect(workFromRow({ ...row, created_at: "", work_contacts: [{ contact_id: "c1" }, { contact_id: "c2" }] } as never)).toEqual(work);
  });
});
