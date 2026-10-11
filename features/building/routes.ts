export const BUILDING_PATH = "/app/building";

export function roomHref(roomId: string): string {
  return `${BUILDING_PATH}?room=${encodeURIComponent(roomId)}`;
}

export function itemHref(roomId: string, itemId: string): string {
  return `${roomHref(roomId)}&item=${encodeURIComponent(itemId)}`;
}
