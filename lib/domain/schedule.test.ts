import { describe, expect, it } from "vitest";

import { formatRepeat, formatSchedules } from "./schedule";

describe("formatRepeat", () => {
  it("reads naturally for single units, intervals, and seasons", () => {
    expect(formatRepeat({ kind: "interval", count: 1, unit: "month" })).toBe("monthly");
    expect(formatRepeat({ kind: "interval", count: 3, unit: "month" })).toBe("every 3 mo");
    expect(formatRepeat({ kind: "interval", count: 10, unit: "year" })).toBe("every 10 yr");
    expect(formatRepeat({ kind: "seasonal", seasons: ["spring", "fall"] })).toBe("spring + fall");
  });
});

describe("formatSchedules", () => {
  it("joins schedules with a dot", () => {
    expect(
      formatSchedules([
        { title: "Test", repeat: { kind: "interval", count: 1, unit: "month" } },
        { title: "Replace", repeat: { kind: "interval", count: 7, unit: "year" } },
      ]),
    ).toBe("Test monthly · Replace every 7 yr");
  });
});
