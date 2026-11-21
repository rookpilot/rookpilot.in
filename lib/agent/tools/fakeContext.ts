import { dataReducer, type DataAction } from "@/lib/data/reducer";
import type { AppData } from "@/lib/data/types";
import type { Building } from "@/lib/domain/models";
import type { ToolContext } from "./define";

// A tool context with a small made-up building, for tests. Changes go through the app's
// reducer instead of Supabase, and are kept in `saved` so tests can check them.

const building = (id: string, name: string): Building => ({
  id,
  name,
  type: "house",
  address: { line1: "", line2: "", city: "", region: "", postalCode: "", country: "" },
  beds: null,
  baths: null,
  yearBuilt: null,
  sqft: null,
  hemisphere: "north",
});

export function fakeData(): AppData {
  return {
    buildings: [building("b1", "Home"), building("b2", "Someone else's")],
    spaces: [
      { id: "kitchen", buildingId: "b1", name: "Kitchen", kind: "kitchen" },
      { id: "yard", buildingId: "b1", name: "Backyard", kind: "garden" },
      { id: "other-room", buildingId: "b2", name: "Their kitchen", kind: "kitchen" },
    ],
    items: [
      { id: "furnace", buildingId: "b1", spaceId: "kitchen", name: "Furnace", templateKey: null, brand: "", model: "", installedOn: "2020-01-15", notes: "" },
      { id: "other-item", buildingId: "b2", spaceId: "other-room", name: "Their fridge", templateKey: null, brand: "", model: "", installedOn: null, notes: "" },
    ],
    schedules: [
      { id: "filter", itemId: "furnace", title: "Replace filter", repeat: { kind: "interval", count: 3, unit: "month" }, lastDoneOn: "2026-09-01", nextDueOn: "2026-12-01", active: true },
      { id: "other-schedule", itemId: "other-item", title: "Clean coils", repeat: { kind: "interval", count: 1, unit: "year" }, lastDoneOn: null, nextDueOn: "2026-11-25", active: true },
    ],
    logs: [
      { id: "log1", buildingId: "b1", itemId: "furnace", scheduleId: "filter", title: "Replace filter", doneOn: "2026-09-01", note: "", cost: 20, contactIds: ["sam"] },
    ],
    work: [
      { id: "deck", buildingId: "b1", kind: "project", title: "Old deck", status: "idea", spaceId: "yard", itemId: null, performedBy: "diy", cost: null, budget: null, startedOn: null, plannedOn: null, finishedOn: null, notes: "", contactIds: [] },
      { id: "faucet", buildingId: "b1", kind: "repair", title: "Furnace noise", status: "open", spaceId: "kitchen", itemId: "furnace", performedBy: "hired", cost: null, budget: null, startedOn: "2026-11-01", plannedOn: null, finishedOn: null, notes: "", contactIds: ["sam"] },
      { id: "other-work", buildingId: "b2", kind: "project", title: "Their patio", status: "idea", spaceId: null, itemId: null, performedBy: "diy", cost: null, budget: null, startedOn: null, plannedOn: null, finishedOn: null, notes: "", contactIds: [] },
    ],
    contacts: [
      { id: "sam", name: "Sam Rivera", company: "Rivera Plumbing", trade: "plumber", phone: "555-0100", email: "", instagram: "", photoPath: null, whyWeLikeThem: "Fast" },
    ],
    attachments: [],
    currentBuildingId: "b1",
    today: "2026-11-20",
  };
}

export function fakeToolContext(): ToolContext & { saved: DataAction[] } {
  const data = fakeData();
  const context = {
    building: data.buildings[0],
    today: data.today,
    data,
    saved: [] as DataAction[],
    async save(action: DataAction) {
      context.saved.push(action);
      context.data = dataReducer(context.data, action);
    },
  };
  return context;
}
