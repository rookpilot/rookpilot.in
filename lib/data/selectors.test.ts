import { describe, expect, it } from "vitest";

import { dataReducer } from "./reducer";
import { createSampleData } from "./sample-data";
import { selectAgenda, selectBuildingSummary, selectCurrentBuilding } from "./selectors";

const TODAY = "2026-10-10";

describe("selectors", () => {
  it("returns the selected building", () => {
    const data = createSampleData(TODAY);
    expect(selectCurrentBuilding(data)?.id).toBe("elm");
  });

  it("lists active timers soonest first, with their item and room", () => {
    const agenda = selectAgenda(createSampleData(TODAY), "elm");
    expect(agenda).toHaveLength(36);
    const dates = agenda.map((e) => e.schedule.nextDueOn);
    expect(dates).toEqual([...dates].sort());
    expect(agenda.every((e) => e.item.id === e.schedule.itemId && e.space.id === e.item.spaceId)).toBe(true);
  });

  it("leaves paused timers out of the agenda and the counts", () => {
    const data = createSampleData(TODAY);
    const first = selectAgenda(data, "elm")[0].schedule;
    const paused = dataReducer(data, { type: "updateSchedule", id: first.id, patch: { active: false } });
    expect(selectAgenda(paused, "elm")).toHaveLength(35);
    expect(selectBuildingSummary(paused, "elm").timers).toBe(35);
  });

  it("counts overdue and due-this-week separately", () => {
    const data = createSampleData(TODAY);
    const summary = selectBuildingSummary(data, "elm");
    const agenda = selectAgenda(data, "elm");
    expect(summary.overdue).toBe(agenda.filter((e) => e.schedule.nextDueOn < TODAY).length);
    expect(summary.overdue).toBeGreaterThan(0);
    expect(summary.items).toBe(26);
  });
});
