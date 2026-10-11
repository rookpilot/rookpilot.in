import { describe, expect, it } from "vitest";

import { createSampleData } from "@/lib/data/sample-data";
import { selectHistory } from "@/lib/data/selectors";

import { filterHistory, groupByMonth, NO_FILTER, totalCost } from "./filter";

const TODAY = "2026-10-10";

describe("filterHistory", () => {
  const history = selectHistory(createSampleData(TODAY), "elm");

  it("filters by type, room, and contact together", () => {
    expect(filterHistory(history, NO_FILTER)).toHaveLength(history.length);
    const repairs = filterHistory(history, { ...NO_FILTER, kind: "repair" });
    expect(repairs.every((e) => e.kind === "repair")).toBe(true);

    const priya = filterHistory(history, { ...NO_FILTER, contactId: "contact-priya" });
    expect(priya.map((e) => e.id)).toEqual(["work-sink-leak"]);

    const sink = priya[0];
    expect(filterHistory(history, { kind: "repair", spaceId: sink.space!.id, contactId: "contact-priya" })).toHaveLength(1);
    expect(filterHistory(history, { kind: "task", spaceId: sink.space!.id, contactId: "contact-priya" })).toHaveLength(0);
  });

  it("adds up costs and groups by month, newest first", () => {
    expect(totalCost(filterHistory(history, { ...NO_FILTER, contactId: "contact-topshelf" }))).toBe(14520);
    const months = groupByMonth(history);
    expect(months[0].label).toBe("October 2026");
    expect(months.flatMap((m) => m.entries)).toHaveLength(history.length);
  });
});
