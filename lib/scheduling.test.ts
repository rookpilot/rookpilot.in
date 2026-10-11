import { describe, expect, it } from "vitest";

import { computeNextDue, describeDue, getDueStatus, sortByDue } from "./scheduling";

describe("computeNextDue", () => {
  it("adds intervals, clamping month ends", () => {
    expect(computeNextDue({ kind: "interval", count: 3, unit: "month" }, "2026-10-10")).toBe("2027-01-10");
    expect(computeNextDue({ kind: "interval", count: 1, unit: "month" }, "2026-01-31")).toBe("2026-02-28");
    expect(computeNextDue({ kind: "interval", count: 10, unit: "year" }, "2026-10-10")).toBe("2036-10-10");
    expect(computeNextDue({ kind: "interval", count: 2, unit: "week" }, "2026-12-25")).toBe("2027-01-08");
  });

  it("picks the next season start, crossing the year when needed", () => {
    const springAndFall = { kind: "seasonal", seasons: ["spring", "fall"] } as const;
    expect(computeNextDue(springAndFall, "2026-04-15")).toBe("2026-09-01");
    expect(computeNextDue(springAndFall, "2026-10-10")).toBe("2027-03-01");
    // Done on the first day of fall: next is spring, not the same day.
    expect(computeNextDue(springAndFall, "2026-09-01")).toBe("2027-03-01");
    expect(computeNextDue({ kind: "seasonal", seasons: ["winter"] }, "2026-10-10")).toBe("2026-12-01");
  });

  it("shifts seasons by six months in the southern hemisphere", () => {
    expect(computeNextDue({ kind: "seasonal", seasons: ["spring"] }, "2026-04-15", "south")).toBe("2026-09-01");
    expect(computeNextDue({ kind: "seasonal", seasons: ["winter"] }, "2026-10-10", "south")).toBe("2027-06-01");
  });
});

describe("getDueStatus", () => {
  it("splits overdue, due soon (14 days), and upcoming", () => {
    expect(getDueStatus("2026-10-09", "2026-10-10")).toBe("overdue");
    expect(getDueStatus("2026-10-10", "2026-10-10")).toBe("due_soon");
    expect(getDueStatus("2026-10-24", "2026-10-10")).toBe("due_soon");
    expect(getDueStatus("2026-10-25", "2026-10-10")).toBe("upcoming");
  });
});

describe("describeDue", () => {
  it("reads like a person would say it", () => {
    const today = "2026-10-10";
    expect(describeDue("2026-10-07", today)).toBe("3 days late");
    expect(describeDue("2026-10-09", today)).toBe("1 day late");
    expect(describeDue("2026-10-10", today)).toBe("Due today");
    expect(describeDue("2026-10-11", today)).toBe("Tomorrow");
    expect(describeDue("2026-10-15", today)).toBe("In 5 days");
    expect(describeDue("2026-11-01", today)).toBe("Nov 1");
    expect(describeDue("2027-03-01", today)).toBe("Mar 1, 2027");
  });
});

describe("sortByDue", () => {
  it("drops paused schedules and sorts soonest first", () => {
    const sorted = sortByDue([
      { id: "a", nextDueOn: "2026-12-01", active: true },
      { id: "b", nextDueOn: "2026-10-01", active: true },
      { id: "c", nextDueOn: "2026-09-01", active: false },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "a"]);
  });
});
