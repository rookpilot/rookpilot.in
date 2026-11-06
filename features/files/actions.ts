import { toast } from "sonner";

import { attachmentPath, guessAttachmentKind, MAX_ATTACHMENT_BYTES, shrinkImage, uploadFile } from "@/lib/data/files";
import { dispatch, newId } from "@/lib/data/store";
import type { Attachment, AttachmentKind } from "@/lib/domain/models";
import { createClient } from "@/lib/supabase/client";

/** What a file is attached to. */
export type FileTarget = { itemId: string } | { workId: string } | { logEntryId: string };

/** Photos bigger than this are shrunk before upload, to save storage. */
const SHRINK_OVER_BYTES = 1.5 * 1024 * 1024;
const PHOTO_MAX_SIDE = 2400;

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  photo: "Photo",
  receipt: "Receipt",
  manual: "Manual",
  other: "Other",
};

/** Shrinks large photos; a shrunk photo becomes a .jpg. Other files are uploaded as they are. */
async function prepare(file: File): Promise<{ blob: Blob; name: string; type: string }> {
  const drawable = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!drawable || file.size <= SHRINK_OVER_BYTES) return { blob: file, name: file.name, type: file.type };
  const blob = await shrinkImage(file, PHOTO_MAX_SIDE);
  if (blob === file) return { blob: file, name: file.name, type: file.type };
  return { blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg", type: "image/jpeg" };
}

/** Uploads one file, then saves its row. Returns false if it couldn't be saved. */
async function uploadOne(buildingId: string, target: FileTarget, file: File): Promise<boolean> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    toast.error(`${file.name} is over 25 MB, so it wasn't added.`);
    return false;
  }
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    toast.error(`${file.name} isn't a photo or PDF, so it wasn't added.`);
    return false;
  }
  try {
    const { blob, name, type } = await prepare(file);
    const id = newId();
    const storagePath = attachmentPath(buildingId, id, name);
    await uploadFile(createClient(), "attachments", storagePath, blob, type);
    const attachment: Attachment = {
      id,
      buildingId,
      itemId: "itemId" in target ? target.itemId : null,
      workId: "workId" in target ? target.workId : null,
      logEntryId: "logEntryId" in target ? target.logEntryId : null,
      kind: guessAttachmentKind(name, type),
      storagePath,
      fileName: name,
      contentType: type,
      sizeBytes: blob.size,
    };
    dispatch({ type: "addAttachment", attachment });
    return true;
  } catch (error) {
    console.error(`Uploading ${file.name} failed`, error);
    toast.error(`Couldn't upload ${file.name}. Check your connection and try again.`);
    return false;
  }
}

export const fileActions = {
  /** Uploads files one at a time, so a slow connection isn't flooded. */
  async upload(buildingId: string, target: FileTarget, files: File[]) {
    for (const file of files) await uploadOne(buildingId, target, file);
  },
  rename(id: string, fileName: string) {
    dispatch({ type: "updateAttachment", id, patch: { fileName: fileName.trim() } });
  },
  setKind(id: string, kind: AttachmentKind) {
    dispatch({ type: "updateAttachment", id, patch: { kind } });
  },
  /** Removes the row and the stored file. */
  remove(id: string) {
    dispatch({ type: "deleteAttachment", id });
  },
};
