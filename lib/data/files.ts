import type { SupabaseClient } from "@supabase/supabase-js";

import type { AttachmentKind } from "@/lib/domain/models";
import type { Database } from "@/lib/supabase/database.types";

/*
 * Files in Supabase Storage. Both buckets are private: files are uploaded and removed
 * here, and shown through links that stop working after an hour (see useSignedUrl).
 */

export type Bucket = "contact-photos" | "attachments";
type Client = SupabaseClient<Database>;

/** Largest file the attachments bucket accepts (matches the bucket's limit). */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = "image/*,application/pdf";

/** "Receipt (Final).pdf" → "Receipt-Final.pdf": safe in a storage path, still recognizable. */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^\w]/g, "").toLowerCase().slice(0, 10) : "";
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

export const contactPhotoPath = (ownerId: string, contactId: string, fileId: string) => `${ownerId}/${contactId}/${fileId}.jpg`;
export const attachmentPath = (buildingId: string, attachmentId: string, fileName: string) =>
  `${buildingId}/${attachmentId}/${safeFileName(fileName)}`;

/** A best guess at what an upload is, from its type and name. People can change it. */
export function guessAttachmentKind(fileName: string, contentType: string): AttachmentKind {
  const name = fileName.toLowerCase();
  if (/receipt|invoice|bill/.test(name)) return "receipt";
  if (/manual|guide|instructions/.test(name)) return "manual";
  if (contentType.startsWith("image/")) return "photo";
  if (contentType === "application/pdf") return "manual";
  return "other";
}

/** "2.4 MB", "830 KB". */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadFile(supabase: Client, bucket: Bucket, path: string, file: Blob, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: false });
  if (error) throw error;
}

/**
 * Removes stored files. Never throws: the database change it follows is already saved,
 * and a leftover file only costs storage space.
 */
export async function removeFiles(supabase: Client, bucket: Bucket, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) console.warn(`Removing files from ${bucket} failed`, error);
}

/** Links for many files at once: path → link, for one hour. */
export async function signUrls(supabase: Client, bucket: Bucket, paths: string[]): Promise<Map<string, string>> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  const links = new Map<string, string>();
  for (const entry of data ?? []) if (entry.path && entry.signedUrl) links.set(entry.path, entry.signedUrl);
  return links;
}

export const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Shrinks a photo to a JPEG whose longest side is at most `maxSide` pixels.
 * Files the browser can't draw (like some phone formats) are returned unchanged.
 */
export async function shrinkImage(file: Blob, maxSide: number, quality = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg") {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ?? file;
}
