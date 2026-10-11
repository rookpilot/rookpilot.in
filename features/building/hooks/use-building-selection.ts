"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Item, Space } from "@/lib/domain/models";

import { itemHref, roomHref } from "../routes";

/** Which pane is in front on narrow screens. Wide screens show all three. */
export type BuildingPane = "rooms" | "items" | "detail";

/**
 * Selected room and item, kept in the URL so links, refresh, and back all work.
 * Unknown ids fall back to the first room and no item.
 */
export function useBuildingSelection(spaces: Space[], items: Item[]) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const roomParam = params.get("room");
  const itemParam = params.get("item");

  const room = spaces.find((s) => s.id === roomParam) ?? spaces[0] ?? null;
  const item = items.find((i) => i.id === itemParam && i.spaceId === room?.id) ?? null;
  const pane: BuildingPane = item ? "detail" : roomParam && room ? "items" : "rooms";

  const go = (href: string) => router.replace(href, { scroll: false });

  return {
    room,
    item,
    pane,
    selectRoom: (roomId: string) => go(roomHref(roomId)),
    selectItem: (roomId: string, itemId: string) => go(itemHref(roomId, itemId)),
    /** Back one level on narrow screens: item → items → rooms. */
    back: () => go(item && room ? roomHref(room.id) : pathname),
  };
}
