import { describe, expect, it } from "vitest";

import { buildItems } from "@/lib/data/builders";
import { dataReducer } from "@/lib/data/reducer";
import { createSampleData } from "@/lib/data/sample-data";
import { selectAgenda } from "@/lib/data/selectors";
import { getItemTemplate } from "@/lib/templates/items";

import { selectCalendarEvents, selectScheduleList } from "./events";

const TODAY = "2026-10-10";

/** The sample house plus four smoke alarms added together, so their timers share dates. */
function withFourAlarms() {
  const data = createSampleData(TODAY);
  const hallway = data.spaces.find((s) => s.buildingId === "elm" && s.kind === "hallway")!;
  let n = 0;
  const added = buildItems(
    {
      buildingId: "elm",
      spaceId: hallway.id,
      name: "Smoke alarm",
      template: getItemTemplate("smoke_alarm") ?? null,
      count: 4,
      installedOn: null,
      hemisphere: "north",
      today: TODAY,
    },
    () => `alarm-${++n}`,
  );
  return dataReducer(data, { type: "addItems", ...added });
}

describe("selectCalendarEvents", () => {
  it("groups matching tasks due the same day", () => {
    const events = selectCalendarEvents(withFourAlarms(), "elm", "2026-11-10", "2026-11-10").get("2026-11-10") ?? [];
    const test = events.find((e) => e.type === "task" && e.label.startsWith("Test · Smoke alarm"));
    expect(test?.label).toBe("Test · Smoke alarm (4)");
    expect(test?.type === "task" && test.entries).toHaveLength(4);
  });

  it("shows completions and planned work on their days", () => {
    const data = createSampleData(TODAY);
    const events = [...selectCalendarEvents(data, "elm", "2026-10-01", "2026-10-31").values()].flat();
    expect(events.some((e) => e.type === "work" && e.work.id === "work-garage-door")).toBe(true);
    const days = [...selectCalendarEvents(data, "elm", "2026-10-01", "2026-10-31").keys()];
    expect(days.every((d) => d >= "2026-10-01" && d <= "2026-10-31")).toBe(true);
  });
});

describe("selectScheduleList", () => {
  it("groups everything due by urgency, keeping every active timer once", () => {
    const data = createSampleData(TODAY);
    const groups = selectScheduleList(data, "elm");
    expect(groups[0].id).toBe("overdue");
    const tasks = groups.flatMap((g) => g.rows).filter((r) => r.type === "task");
    expect(tasks).toHaveLength(selectAgenda(data, "elm").length);
  });

  it("includes unfinished projects and repairs with a date, but not finished ones", () => {
    const rows = selectScheduleList(createSampleData(TODAY), "elm").flatMap((g) => g.rows);
    const work = rows.flatMap((r) => (r.type === "work" ? [r.work.id] : []));
    expect(work).toEqual(["work-garage-door", "work-fire-pit"]);
  });
});
