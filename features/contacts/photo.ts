/** Longest side of a stored contact photo, in pixels. Avatars never show bigger. */
const MAX_SIDE = 256;

/**
 * Reads a picked image and shrinks it to a small JPEG data URL. Phase 1 keeps it in memory;
 * phase 2 uploads it to storage instead.
 */
export async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
