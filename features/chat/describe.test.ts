import { describe, expect, it } from "vitest";

import { fakeData } from "@/lib/agent/tools/fakeContext";

import { describeChange } from "./describe";

const change = (tool: string, input: Record<string, unknown>, kind: "write" | "delete" = "write") => ({ toolCallId: "t", tool, kind, input });

describe("describeChange", () => {
  it("shows a new project with names instead of ids, and which fields can be edited", () => {
    const view = describeChange(change("create_work", { kind: "project", title: "Fire pit", room_id: "yard", budget: 500, planned_on: "2027-04-01" }), fakeData());

    expect(view.title).toBe("New project");
    expect(view.record).toBeUndefined();
    expect(view.fields.map(({ label, text, edit }) => ({ label, text, edit }))).toEqual([
      { label: "Kind", text: "Project", edit: undefined },
      { label: "Title", text: "Fire pit", edit: "text" },
      { label: "Room", text: "Backyard", edit: undefined },
      { label: "Budget", text: "$500", edit: "number" },
      { label: "Planned", text: "Apr 1, 2027", edit: "date" },
    ]);
  });

  it("names the record an update or delete is about", () => {
    expect(describeChange(change("update_work", { id: "deck", status: "planning" }), fakeData())).toMatchObject({
      title: "Change project or repair",
      record: "Old deck",
      fields: [{ label: "Status", text: "Planning", edit: undefined }],
    });
    expect(describeChange(change("delete_room", { id: "kitchen" }, "delete"), fakeData())).toMatchObject({ title: "Delete room", record: "Kitchen", fields: [] });
  });

  it("shows schedules, contacts, and room kinds in words", () => {
    const view = describeChange(
      change("complete_schedule", { id: "filter", contact_ids: ["sam"], cost: 20 }),
      fakeData(),
    );
    expect(view.record).toBe("Replace filter");
    expect(view.fields.map((f) => f.text)).toEqual(["Sam Rivera", "$20"]);

    expect(describeChange(change("create_schedule", { item_id: "furnace", title: "Check", repeat: { kind: "interval", count: 3, unit: "month" } }), fakeData()).fields[2].text).toBe("every 3 mo");
    expect(describeChange(change("create_room", { name: "Yard", kind: "garden" }), fakeData()).fields[1].text).toBe("Garden or yard");
  });

  it("still works before the app's data has loaded", () => {
    expect(describeChange(change("delete_item", { id: "furnace" }, "delete"), null)).toMatchObject({ title: "Delete item", record: "Unknown record" });
  });
});
