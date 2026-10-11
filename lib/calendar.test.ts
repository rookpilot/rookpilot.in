import { describe, expect, it } from "vitest";

import { monthWeeks, rangeLabel, shiftAnchor, visibleRange, weekDays } from "./calendar";

describe("weekDays", () => {
  it("runs Sunday to Saturday around the anchor", () => {
    expect(weekDays("2026-10-14")).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
  });
});

describe("monthWeeks", () => {
  it("covers the month in whole weeks", () => {
    const weeks = monthWeeks("2026-10-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe("2026-09-27");
    expect(weeks.at(-1)!.at(-1)).toBe("2026-10-31");
  });

  it("uses six rows when the month needs them", () => {
    expect(monthWeeks("2026-08-15")).toHaveLength(6);
  });
});

describe("shiftAnchor", () => {
  it("moves a week by 7 days", () => {
    expect(shiftAnchor("week", "2026-12-30", 1)).toBe("2027-01-06");
  });

  it("moves a month to the 1st of the next or previous month", () => {
    expect(shiftAnchor("month", "2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftAnchor("month", "2026-01-31", -1)).toBe("2025-12-01");
  });
});

describe("rangeLabel", () => {
  it("names months and weeks", () => {
    expect(rangeLabel("month", "2026-10-10")).toBe("October 2026");
    expect(rangeLabel("week", "2026-10-14")).toBe("Oct 11 – 17, 2026");
    expect(rangeLabel("week", "2026-10-01")).toBe("Sep 27 – Oct 3, 2026");
    expect(rangeLabel("week", "2026-12-30")).toBe("Dec 27, 2026 – Jan 2, 2027");
  });
});

describe("visibleRange", () => {
  it("spans the whole grid", () => {
    expect(visibleRange("month", "2026-10-10")).toEqual({ from: "2026-09-27", to: "2026-10-31" });
    expect(visibleRange("week", "2026-10-10")).toEqual({ from: "2026-10-04", to: "2026-10-10" });
  });
});
