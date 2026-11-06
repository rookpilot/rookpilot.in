import { readFileSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";
import { getItemTemplate } from "@/lib/templates/items";

import { buildItems } from "./builders";
import { attachmentPath, contactPhotoPath, uploadFile, type Bucket } from "./files";
import { dataReducer, type DataAction } from "./reducer";
import { loadAppData, persist } from "./remote";
import type { AppData } from "./types";

/*
 * Runs every kind of change through the real save code against local Supabase, then
 * reloads and checks the database matches what the screen showed.
 * Needs local Supabase with the seed data: run with `npm run db:test`.
 */

const enabled = process.env.SUPABASE_DB_TESTS === "1";

function localEnv() {
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

const today = "2026-11-05";
const id = () => crypto.randomUUID();
const byId = <T extends { id: string }>(list: T[]) => [...list].sort((a, b) => a.id.localeCompare(b.id));

/** The parts of the data that belong to one building, plus one contact, in a stable order. */
function slice(data: AppData, buildingId: string, contactId: string) {
  const items = data.items.filter((i) => i.buildingId === buildingId);
  const itemIds = new Set(items.map((i) => i.id));
  return {
    buildings: data.buildings.filter((b) => b.id === buildingId),
    spaces: byId(data.spaces.filter((s) => s.buildingId === buildingId)),
    items: byId(items),
    schedules: byId(data.schedules.filter((s) => itemIds.has(s.itemId))),
    logs: byId(data.logs.filter((l) => l.buildingId === buildingId)).map((l) => ({ ...l, contactIds: [...l.contactIds].sort() })),
    work: byId(data.work.filter((w) => w.buildingId === buildingId)).map((w) => ({ ...w, contactIds: [...w.contactIds].sort() })),
    contacts: data.contacts.filter((c) => c.id === contactId),
  };
}

describe.skipIf(!enabled)("saving to Supabase", () => {
  let supabase: SupabaseClient<Database>;
  let state: AppData;
  const buildingId = id();
  const contactId = id();

  async function apply(action: DataAction) {
    const before = state;
    state = dataReducer(state, action);
    await persist(supabase, action, before);
  }

  beforeAll(async () => {
    const { url, key } = localEnv();
    supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.auth.signInWithPassword({ email: "test@rookpilot.dev", password: "password123" });
    if (error) throw new Error(`Sign in as the seed user failed (run npm run db:reset?): ${error.message}`);
    state = { ...(await loadAppData(supabase, today)), currentBuildingId: null };
  });

  afterAll(async () => {
    await supabase.from("buildings").delete().eq("id", buildingId);
    await supabase.from("contacts").delete().eq("id", contactId);
  });

  it("loads the seed user's buildings", () => {
    expect(state.buildings.map((b) => b.name)).toContain("Elm Street house");
  });

  it("saves every kind of change, and a reload matches the screen", async () => {
    const kitchen = id();
    const garage = id();

    await apply({
      type: "addBuilding",
      building: {
        id: buildingId,
        name: "Save test house",
        type: "house",
        address: { line1: "1 Test Way", line2: "", city: "Portland", region: "OR", postalCode: "97201", country: "US" },
        beds: 2,
        baths: 1,
        yearBuilt: null,
        sqft: null,
        hemisphere: "north",
      },
      spaces: [{ id: kitchen, buildingId, name: "Kitchen", kind: "kitchen" }],
      items: [],
      schedules: [],
    });
    await apply({ type: "updateBuilding", id: buildingId, patch: { name: "Save test home", sqft: 900 } });
    await apply({ type: "addSpace", space: { id: garage, buildingId, name: "Garage", kind: "garage" } });
    await apply({ type: "updateSpace", id: garage, patch: { name: "Big garage", kind: "garage" } });

    const created = buildItems(
      { buildingId, spaceId: kitchen, name: "Fridge filter", template: getItemTemplate("fridge_filter") ?? null, count: 2, installedOn: null, hemisphere: "north", today },
      id,
    );
    await apply({ type: "addItems", ...created });
    const [first, second] = created.items;
    await apply({ type: "updateItem", id: first.id, patch: { brand: "Acme", installedOn: "2026-01-02" } });

    const extra = { id: id(), itemId: first.id, title: "Check seal", repeat: { kind: "seasonal" as const, seasons: ["spring" as const] }, lastDoneOn: null, nextDueOn: "2027-03-01", active: true };
    await apply({ type: "addSchedule", schedule: extra });
    await apply({ type: "updateSchedule", id: extra.id, patch: { active: false } });

    await apply({
      type: "addContact",
      contact: { id: contactId, name: "Save test plumber", company: "", trade: "Plumber", phone: "", email: "", instagram: "", photoPath: null, whyWeLikeThem: "" },
    });
    await apply({ type: "updateContact", id: contactId, patch: { phone: "(503) 555-0100" } });

    const timer = created.schedules.find((s) => s.itemId === first.id)!;
    await apply({
      type: "completeSchedules",
      completions: [
        {
          log: { id: id(), buildingId, itemId: first.id, scheduleId: timer.id, title: timer.title, doneOn: today, note: "Swapped it", cost: 39.99, contactIds: [contactId] },
          lastDoneOn: today,
          nextDueOn: "2027-05-05",
        },
      ],
    });

    const repair = id();
    await apply({
      type: "addWork",
      work: {
        id: repair, buildingId, kind: "repair", title: "Drip", status: "open", spaceId: kitchen, itemId: second.id, performedBy: "hired",
        cost: null, budget: null, startedOn: today, plannedOn: null, finishedOn: null, notes: "", contactIds: [contactId],
      },
    });
    await apply({ type: "updateWork", id: repair, patch: { status: "fixed", finishedOn: today } });
    // Moving the item to the garage takes its repair along.
    await apply({ type: "updateItem", id: second.id, patch: { spaceId: garage } });

    const reloaded = { ...(await loadAppData(supabase, today)), currentBuildingId: null };
    expect(slice(reloaded, buildingId, contactId)).toEqual(slice(state, buildingId, contactId));
  });

  it("saves deletes, and the database removes or unlinks what depended on them", async () => {
    const repair = state.work.find((w) => w.buildingId === buildingId)!;
    await apply({ type: "updateWork", id: repair.id, patch: { contactIds: [] } });
    await apply({ type: "deleteSchedule", id: state.schedules.find((s) => s.title === "Check seal")!.id });
    await apply({ type: "deleteItem", id: repair.itemId! });
    await apply({ type: "deleteSpace", id: state.spaces.find((s) => s.buildingId === buildingId && s.name === "Big garage")!.id });
    await apply({ type: "deleteContact", id: contactId });

    let reloaded = { ...(await loadAppData(supabase, today)), currentBuildingId: null };
    expect(slice(reloaded, buildingId, contactId)).toEqual(slice(state, buildingId, contactId));

    await apply({ type: "deleteBuilding", id: buildingId });
    reloaded = { ...(await loadAppData(supabase, today)), currentBuildingId: null };
    expect(reloaded.buildings.some((b) => b.id === buildingId)).toBe(false);
    expect(reloaded.items.some((i) => i.buildingId === buildingId)).toBe(false);
  });
});

describe.skipIf(!enabled)("files in Supabase Storage", () => {
  const elm = "b0000000-0000-0000-0000-000000000001";
  const moms = "b0000000-0000-0000-0000-000000000002";
  const dana = "c0000000-0000-0000-0000-000000000001"; // test's contact, tagged on Elm Street's repair
  const priya = "c0000000-0000-0000-0000-000000000002"; // test's contact, not tagged anywhere
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const file = () => new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
  const photo = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" });

  let owner: SupabaseClient<Database>;
  let partner: SupabaseClient<Database>;
  let state: AppData;
  const uploaded: { bucket: Bucket; path: string; client: () => SupabaseClient<Database> }[] = [];

  async function signIn(email: string) {
    const { url, key } = localEnv();
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email, password: "password123" });
    if (error) throw new Error(`Sign in as ${email} failed (run npm run db:reset?): ${error.message}`);
    return client;
  }

  async function put(client: SupabaseClient<Database>, bucket: Bucket, path: string, blob: Blob) {
    await uploadFile(client, bucket, path, blob, blob.type);
    uploaded.push({ bucket, path, client: () => client });
  }

  const canRead = async (client: SupabaseClient<Database>, bucket: Bucket, path: string) =>
    !(await client.storage.from(bucket).download(path)).error;

  beforeAll(async () => {
    owner = await signIn("test@rookpilot.dev");
    partner = await signIn("partner@rookpilot.dev");
    state = { ...(await loadAppData(owner, today)), currentBuildingId: null };
  });

  afterAll(async () => {
    for (const { bucket, path, client } of uploaded) await client().storage.from(bucket).remove([path]);
  });

  it("shares a building's files with its members only", async () => {
    const elmFile = attachmentPath(elm, id(), "Garage receipt.pdf");
    const momsFile = attachmentPath(moms, id(), "Furnace manual.pdf");
    await put(owner, "attachments", elmFile, file());
    await put(partner, "attachments", momsFile, file());

    expect(await canRead(partner, "attachments", elmFile)).toBe(true);
    expect(await canRead(owner, "attachments", momsFile)).toBe(false);
    await expect(uploadFile(owner, "attachments", attachmentPath(moms, id(), "sneaky.pdf"), file(), "application/pdf")).rejects.toThrow();
  });

  it("shows a contact's photo only where the contact is shared", async () => {
    const danaPhoto = contactPhotoPath(ownerId, dana, id());
    const priyaPhoto = contactPhotoPath(ownerId, priya, id());
    await put(owner, "contact-photos", danaPhoto, photo());
    await put(owner, "contact-photos", priyaPhoto, photo());

    expect(await canRead(partner, "contact-photos", danaPhoto)).toBe(true);
    expect(await canRead(partner, "contact-photos", priyaPhoto)).toBe(false);
    await expect(uploadFile(partner, "contact-photos", contactPhotoPath(ownerId, dana, id()), photo(), "image/jpeg")).rejects.toThrow();
  });

  it("saves a file's row, and deleting it removes the stored file", async () => {
    const item = state.items.find((i) => i.buildingId === elm)!;
    const attachmentId = id();
    const storagePath = attachmentPath(elm, attachmentId, "filter.pdf");
    await uploadFile(owner, "attachments", storagePath, file(), "application/pdf");
    const attachment = { id: attachmentId, buildingId: elm, itemId: item.id, workId: null, logEntryId: null, kind: "manual" as const, storagePath, fileName: "filter.pdf", contentType: "application/pdf", sizeBytes: 13 };

    let before = state;
    state = dataReducer(state, { type: "addAttachment", attachment });
    await persist(owner, { type: "addAttachment", attachment }, before);
    before = state;
    state = dataReducer(state, { type: "updateAttachment", id: attachmentId, patch: { fileName: "Filter manual.pdf" } });
    await persist(owner, { type: "updateAttachment", id: attachmentId, patch: { fileName: "Filter manual.pdf" } }, before);

    const reloaded = await loadAppData(owner, today);
    expect(reloaded.attachments.find((a) => a.id === attachmentId)).toEqual({ ...attachment, fileName: "Filter manual.pdf" });

    before = state;
    state = dataReducer(state, { type: "deleteAttachment", id: attachmentId });
    await persist(owner, { type: "deleteAttachment", id: attachmentId }, before);
    expect(await canRead(owner, "attachments", storagePath)).toBe(false);
    expect((await loadAppData(owner, today)).attachments.some((a) => a.id === attachmentId)).toBe(false);
  });
});
