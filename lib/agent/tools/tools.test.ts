import { describe, expect, it } from "vitest";
import { fakeToolContext } from "./fakeContext";
import { findTool } from "./index";

// Each tool against a small made-up building (see fakeContext.ts). Saving goes through the
// app's reducer here; lib/data/remote.db.test.ts covers the same changes against Supabase.

async function call(name: string, input: Record<string, unknown>, ctx = fakeToolContext()) {
  const tool = findTool(name)!;
  const output = (await tool.run(tool.parse(input), ctx)) as Record<string, unknown>;
  return { output, ctx, saved: ctx.saved };
}

function effects(name: string, input: Record<string, unknown>) {
  const tool = findTool(name)!;
  return tool.effects?.(tool.parse(input), fakeToolContext());
}

describe("every tool", () => {
  it("refuses ids from another building", async () => {
    await expect(call("update_work", { id: "other-work", title: "Mine now", ask_first: false })).rejects.toThrow("no project or repair with id other-work");
    await expect(call("delete_item", { id: "other-item" })).rejects.toThrow("no item");
    await expect(call("complete_schedule", { id: "other-schedule", ask_first: false })).rejects.toThrow("no schedule");
    await expect(call("create_item", { room_id: "other-room", name: "Fridge", ask_first: false })).rejects.toThrow("no room");
  });

  it("only lists the current building's records", async () => {
    expect((await call("list_work", {})).output).toHaveLength(2);
    expect((await call("list_schedules", {})).output).toHaveLength(1);
    expect((await call("list_items", {})).output).toHaveLength(1);
  });
});

describe("projects and repairs", () => {
  it("creates a project with the app's defaults", async () => {
    const { output, saved } = await call("create_work", { kind: "project", title: " Fire pit ", room_id: "yard", ask_first: false });

    expect(saved[0]).toMatchObject({
      type: "addWork",
      work: { buildingId: "b1", kind: "project", title: "Fire pit", status: "idea", spaceId: "yard", performedBy: "diy", startedOn: "2026-11-20", finishedOn: null },
    });
    expect(output).toMatchObject({ title: "Fire pit", status: "idea", room: "Backyard" });
  });

  it("puts work on an item in the item's room", async () => {
    const { saved } = await call("create_work", { kind: "repair", title: "Rattle", item_id: "furnace", ask_first: false });
    expect(saved[0]).toMatchObject({ work: { status: "open", itemId: "furnace", spaceId: "kitchen" } });
  });

  it("rejects a status or budget that doesn't fit the kind", async () => {
    await expect(call("create_work", { kind: "project", title: "Deck", status: "fixed", ask_first: false })).rejects.toThrow("A project can't be fixed");
    await expect(call("create_work", { kind: "repair", title: "Leak", budget: 100, ask_first: false })).rejects.toThrow("Only projects have a budget");
  });

  it("sets the finished date to today when work is finished, and clears it when reopened", async () => {
    const { ctx, output } = await call("update_work", { id: "faucet", status: "fixed", cost: 150, ask_first: false });
    expect(output).toMatchObject({ status: "fixed", cost: 150, finished_on: "2026-11-20" });

    const reopened = await call("update_work", { id: "faucet", status: "open", ask_first: false }, ctx);
    expect(reopened.output.finished_on).toBeUndefined();
  });

  it("only changes the fields Claude set", async () => {
    const { saved } = await call("update_work", { id: "deck", title: "New deck", ask_first: false });
    expect(saved[0]).toEqual({ type: "updateWork", id: "deck", patch: { title: "New deck", finishedOn: null } });
  });

  it("deletes", async () => {
    const { saved, output } = await call("delete_work", { id: "deck" });
    expect(saved).toEqual([{ type: "deleteWork", id: "deck" }]);
    expect(output).toEqual({ deleted: "Old deck" });
  });
});

describe("schedules", () => {
  it("lists what's due, leaving out paused ones", async () => {
    const ctx = fakeToolContext();
    expect((await call("list_schedules", { due_before: "2026-12-31" }, ctx)).output).toHaveLength(1);
    await call("update_schedule", { id: "filter", active: false, ask_first: false }, ctx);
    expect((await call("list_schedules", { due_before: "2026-12-31" }, ctx)).output).toHaveLength(0);
  });

  it("counts a new schedule from today when no due date is given", async () => {
    const { output } = await call("create_schedule", { item_id: "furnace", title: "Check pilot", repeat: { kind: "interval", count: 3, unit: "month" }, ask_first: false });
    expect(output).toMatchObject({ title: "Check pilot", item: "Furnace", next_due_on: "2027-02-20" });
  });

  it("uses the due date Claude gives", async () => {
    const { output } = await call("create_schedule", { item_id: "furnace", title: "Check pilot", repeat: { kind: "interval", count: 3, unit: "month" }, next_due_on: "2026-12-21", ask_first: false });
    expect(output.next_due_on).toBe("2026-12-21");
  });

  it("moves the due date when the repeat changes, like the app", async () => {
    const { output } = await call("update_schedule", { id: "filter", repeat: { kind: "interval", count: 1, unit: "month" }, ask_first: false });
    expect(output.next_due_on).toBe("2026-10-01");
  });

  it("marks one done today, adds it to history, and moves it forward", async () => {
    const { output, saved } = await call("complete_schedule", { id: "filter", contact_ids: ["sam"], ask_first: false });

    expect(saved[0]).toMatchObject({
      type: "completeSchedules",
      completions: [{ log: { scheduleId: "filter", itemId: "furnace", title: "Replace filter", doneOn: "2026-11-20", contactIds: ["sam"] }, lastDoneOn: "2026-11-20", nextDueOn: "2027-02-20" }],
    });
    expect(output).toMatchObject({ done_on: "2026-11-20", next_due_on: "2027-02-20" });
  });

  it("rejects unknown contacts", async () => {
    await expect(call("complete_schedule", { id: "filter", contact_ids: ["nobody"], ask_first: false })).rejects.toThrow("no contact");
  });
});

describe("contacts", () => {
  it("searches by name, company, or trade", async () => {
    expect((await call("list_contacts", { search: "rivera" })).output).toHaveLength(1);
    expect((await call("list_contacts", { trade: "Plumb" })).output).toHaveLength(1);
    expect((await call("list_contacts", { trade: "roofer" })).output).toHaveLength(0);
  });

  it("creates and updates, with notes as why we like them", async () => {
    const { saved } = await call("create_contact", { name: "Ana", trade: "roofer", notes: "Honest", ask_first: false });
    expect(saved[0]).toMatchObject({ type: "addContact", contact: { name: "Ana", trade: "roofer", whyWeLikeThem: "Honest", photoPath: null } });

    const updated = await call("update_contact", { id: "sam", phone: "555-0199", ask_first: false });
    expect(updated.saved[0]).toEqual({ type: "updateContact", id: "sam", patch: { phone: "555-0199" } });
  });

  it("says on the card what a delete untags", () => {
    expect(effects("delete_contact", { id: "sam" })).toBe("They're untagged from 2 projects, repairs, and history entries, which stay.");
  });
});

describe("rooms and items", () => {
  it("lists rooms with their item counts", async () => {
    expect((await call("list_rooms", {})).output).toEqual([
      { id: "kitchen", name: "Kitchen", kind: "kitchen", items: 1 },
      { id: "yard", name: "Backyard", kind: "garden", items: 0 },
    ]);
  });

  it("creates a room and an item in it", async () => {
    const room = await call("create_room", { name: "Garage", ask_first: false });
    const item = await call("create_item", { room_id: room.output.id, name: "Water heater", brand: "Rheem", ask_first: false }, room.ctx);

    expect(room.saved[0]).toMatchObject({ type: "addSpace", space: { name: "Garage", kind: "other" } });
    expect(item.output).toMatchObject({ name: "Water heater", room: "Garage", brand: "Rheem" });
  });

  it("moves an item to another room", async () => {
    const { output, ctx } = await call("update_item", { id: "furnace", room_id: "yard", ask_first: false });
    expect(output.room).toBe("Backyard");
    expect(ctx.data.work.find((w) => w.id === "faucet")?.spaceId).toBe("yard");
  });

  it("says on the card what a room or item delete takes with it", () => {
    expect(effects("delete_room", { id: "kitchen" })).toBe("Also deletes 1 item, 1 schedule, 1 history entry. 1 project or repair stays, unlinked.");
    expect(effects("delete_room", { id: "yard" })).toBe("1 project or repair stays, unlinked.");
    expect(effects("delete_item", { id: "furnace" })).toBe("Also deletes 1 schedule, 1 history entry. 1 project or repair stays, unlinked.");
  });
});

describe("history", () => {
  it("lists finished maintenance and work, newest first", async () => {
    const ctx = fakeToolContext();
    await call("update_work", { id: "faucet", status: "fixed", ask_first: false }, ctx);
    const { output } = await call("list_history", {}, ctx);

    expect(output).toMatchObject([
      { kind: "repair", title: "Furnace noise", finished_on: "2026-11-20" },
      { kind: "task", title: "Replace filter", date: "2026-09-01", cost: 20, helped_by: ["Sam Rivera"] },
    ]);
  });

  it("filters by date", async () => {
    expect((await call("list_history", { since: "2026-10-01" })).output).toHaveLength(0);
  });
});
