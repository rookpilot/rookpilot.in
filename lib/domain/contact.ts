import type { Contact } from "./models";

/** "Dana Ruiz" → "DR", "Top Shelf Roofing" → "TS". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/** Accepts "@ruizdoors", "ruizdoors", or an instagram.com link, and returns "ruizdoors". */
export function normalizeInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

/** "Garage doors · Ruiz Door Co." */
export function describeContact(contact: Pick<Contact, "trade" | "company">): string {
  return [contact.trade, contact.company].filter(Boolean).join(" · ");
}
