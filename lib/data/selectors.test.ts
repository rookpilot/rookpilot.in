import { describe, expect, it } from "vitest";

import { dataReducer } from "./reducer";
import { createSampleData } from "./sample-data";
import { selectAgenda, selectBuildingSummary, selectContactHistory, selectCurrentBuilding, selectHistory, selectWork } from "./selectors";

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

describe("work and history selectors", () => {
  it("lists unfinished work first, soonest planned first", () => {
    const repairs = selectWork(createSampleData(TODAY), "elm", "repair");
    expect(repairs.map((w) => w.status)).toEqual(["in_progress", "open", "fixed", "fixed"]);
    expect(repairs.at(-1)?.id).toBe("work-shingles");
  });

  it("counts open repairs on Home", () => {
    expect(selectBuildingSummary(createSampleData(TODAY), "elm").openRepairs).toBe(2);
  });

  it("puts completions and finished work in History, newest first", () => {
    const history = selectHistory(createSampleData(TODAY), "elm");
    const dates = history.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(history.some((e) => e.kind === "repair" && e.work.id === "work-sink-leak")).toBe(true);
    expect(history.some((e) => e.kind === "repair" && e.work.id === "work-garage-door")).toBe(false);
  });

  it("shows everything a contact helped with, including unfinished work", () => {
    const helped = selectContactHistory(createSampleData(TODAY), "contact-dana");
    expect(helped.map((e) => e.kind).sort()).toEqual(["repair", "task"]);
  });
});
