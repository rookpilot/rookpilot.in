import { describe, expect, it } from "vitest";

import type { Attachment } from "@/lib/domain/models";

import { attachmentsRemovedBy, dataReducer } from "./reducer";
import { createSampleData } from "./sample-data";

const TODAY = "2026-11-06";

/** Sample data with one file on an item, one on that item's history, and one on a repair. */
function withFiles() {
  const data = createSampleData(TODAY);
  const log = data.logs[0];
  const item = data.items.find((i) => i.id === log.itemId)!;
  const work = data.work.find((w) => w.buildingId === item.buildingId)!;
  const file = (id: string, link: Partial<Attachment>): Attachment => ({
    id, buildingId: item.buildingId, itemId: null, workId: null, logEntryId: null, kind: "other",
    storagePath: `${item.buildingId}/${id}/f.pdf`, fileName: "f.pdf", contentType: "application/pdf", sizeBytes: 1, ...link,
  });
  const attachments = [file("on-item", { itemId: item.id }), file("on-log", { logEntryId: log.id }), file("on-work", { workId: work.id })];
  return { data: { ...data, attachments }, item, log, work };
}

const ids = (files: Attachment[]) => files.map((f) => f.id).sort();

describe("files removed by a delete", () => {
  it("deleting an item takes its files and its history's files, not the repair's", () => {
    const { data, item } = withFiles();
    expect(ids(attachmentsRemovedBy(data, { type: "deleteItem", id: item.id }))).toEqual(["on-item", "on-log"]);
    expect(ids(dataReducer(data, { type: "deleteItem", id: item.id }).attachments)).toEqual(["on-work"]);
  });

  it("deleting a room takes the files of its items", () => {
    const { data, item } = withFiles();
    expect(ids(attachmentsRemovedBy(data, { type: "deleteSpace", id: item.spaceId }))).toEqual(["on-item", "on-log"]);
  });

  it("deleting a repair or history entry takes only its own files", () => {
    const { data, work, log } = withFiles();
    expect(ids(attachmentsRemovedBy(data, { type: "deleteWork", id: work.id }))).toEqual(["on-work"]);
    expect(ids(attachmentsRemovedBy(data, { type: "deleteLog", id: log.id }))).toEqual(["on-log"]);
  });

  it("deleting a building takes all its files", () => {
    const { data, item } = withFiles();
    expect(dataReducer(data, { type: "deleteBuilding", id: item.buildingId }).attachments).toEqual([]);
  });

  it("other changes leave files alone", () => {
    const { data, item } = withFiles();
    expect(attachmentsRemovedBy(data, { type: "updateItem", id: item.id, patch: { notes: "x" } })).toEqual([]);
  });
});
