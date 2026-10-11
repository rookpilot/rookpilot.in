export const CONTACTS_PATH = "/app/contacts";

export function contactHref(id: string): string {
  return `${CONTACTS_PATH}?id=${encodeURIComponent(id)}`;
}
