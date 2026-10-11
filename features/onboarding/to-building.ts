import { buildItems, type IdFactory } from "@/lib/data/builders";
import type { Building, ISODate, Item, Schedule, Space } from "@/lib/domain/models";
import { getItemTemplate } from "@/lib/templates/items";
import { WHOLE_BUILDING_ROOM } from "@/lib/templates/rooms";

import { resolveBuildingName } from "./selectors";
import type { OnboardingDraft } from "./state";

export interface NewBuilding {
  building: Building;
  spaces: Space[];
  items: Item[];
  schedules: Schedule[];
}

const toNumber = (value: string) => (value.trim() ? Number.parseInt(value, 10) : null);

/**
 * Turns the finished wizard into a building with rooms, items, and timers.
 * In phase 2 this becomes the body of the "create building" API call.
 */
export function draftToBuilding(draft: OnboardingDraft, today: ISODate, newId: IdFactory): NewBuilding {
  if (!draft.buildingType) throw new Error("A building type is required to finish onboarding.");

  const building: Building = {
    id: newId(),
    name: resolveBuildingName(draft),
    type: draft.buildingType,
    address: { ...draft.address },
    beds: toNumber(draft.basics.beds),
    baths: toNumber(draft.basics.baths),
    yearBuilt: toNumber(draft.basics.yearBuilt),
    sqft: toNumber(draft.basics.sqft),
    hemisphere: "north",
  };

  // Every building keeps a whole-building room, even when rooms were skipped.
  const roomDrafts = draft.rooms.length > 0 ? draft.rooms : [{ id: "whole", ...WHOLE_BUILDING_ROOM }];
  const spaceIds = new Map(roomDrafts.map((room) => [room.id, newId()]));
  const spaces: Space[] = roomDrafts.map((room) => ({
    id: spaceIds.get(room.id)!,
    buildingId: building.id,
    name: room.name.trim(),
    kind: room.kind,
  }));

  const created = draft.items
    .filter((item) => item.selected && spaceIds.has(item.roomId))
    .map((item) =>
      buildItems(
        {
          buildingId: building.id,
          spaceId: spaceIds.get(item.roomId)!,
          name: item.name,
          template: item.templateKey ? (getItemTemplate(item.templateKey) ?? null) : null,
          count: item.count,
          installedOn: null,
          hemisphere: building.hemisphere,
          today,
        },
        newId,
      ),
    );

  return {
    building,
    spaces,
    items: created.flatMap((c) => c.items),
    schedules: created.flatMap((c) => c.schedules),
  };
}
