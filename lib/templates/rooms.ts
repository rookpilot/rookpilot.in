import { BUILDING_TYPE_INFO, type BuildingType } from "@/lib/domain/building";
import type { RoomKind } from "@/lib/domain/room";

export interface RoomSuggestion {
  name: string;
  kind: RoomKind;
}

export const WHOLE_BUILDING_ROOM: RoomSuggestion = { name: "Whole building", kind: "whole_building" };

const COMMERCIAL_ROOMS: Partial<Record<BuildingType, RoomSuggestion[]>> = {
  gym: [
    { name: "Main floor", kind: "other" },
    { name: "Locker rooms", kind: "bathroom" },
    { name: "Front desk", kind: "other" },
    { name: "Office", kind: "other" },
  ],
  store_cafe: [
    { name: "Sales floor", kind: "other" },
    { name: "Kitchen", kind: "kitchen" },
    { name: "Restroom", kind: "bathroom" },
    { name: "Storage", kind: "other" },
  ],
  office: [
    { name: "Open office", kind: "other" },
    { name: "Conference room", kind: "other" },
    { name: "Kitchen", kind: "kitchen" },
    { name: "Restroom", kind: "bathroom" },
  ],
  theater: [
    { name: "Auditorium", kind: "other" },
    { name: "Lobby", kind: "hallway" },
    { name: "Concession stand", kind: "kitchen" },
    { name: "Restrooms", kind: "bathroom" },
  ],
};

function parseCount(value: string, fallback: number, max = 10): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(n, max);
}

function bedrooms(count: number): RoomSuggestion[] {
  if (count === 0) return [];
  const rooms: RoomSuggestion[] = [{ name: "Master bedroom", kind: "bedroom" }];
  for (let i = 1; i < count; i++) rooms.push({ name: `Bedroom ${i}`, kind: "bedroom" });
  return rooms;
}

function bathrooms(count: number): RoomSuggestion[] {
  if (count === 0) return [];
  if (count === 1) return [{ name: "Bathroom", kind: "bathroom" }];
  const rooms: RoomSuggestion[] = [
    { name: "Master bath", kind: "bathroom" },
    { name: "Hall bath", kind: "bathroom" },
  ];
  for (let i = 3; i <= count; i++) rooms.push({ name: `Bath ${i}`, kind: "bathroom" });
  return rooms;
}

/**
 * Rooms to suggest for a new building. Residential suggestions use the bed and bath
 * counts from the Basics step when given. The whole-building room always comes first.
 */
export function suggestRooms(type: BuildingType | null, counts: { beds: string; baths: string }): RoomSuggestion[] {
  if (type && BUILDING_TYPE_INFO[type].category === "commercial") {
    return [WHOLE_BUILDING_ROOM, ...(COMMERCIAL_ROOMS[type] ?? [])];
  }

  const isApartment = type === "apartment_condo";
  const rooms: RoomSuggestion[] = [
    WHOLE_BUILDING_ROOM,
    ...bedrooms(parseCount(counts.beds, isApartment ? 1 : 2)),
    ...bathrooms(parseCount(counts.baths, 1)),
    { name: "Kitchen", kind: "kitchen" },
    { name: "Living room", kind: "living" },
    { name: "Hallway", kind: "hallway" },
  ];

  if (!isApartment) {
    rooms.push({ name: "Laundry", kind: "laundry" });
  }
  if (type === "house" || type === "mobile_home") {
    rooms.push({ name: "Garage", kind: "garage" });
  }
  if (type === "house" || type === "rental" || type === "mobile_home") {
    rooms.push({ name: "Garden", kind: "garden" });
  }
  return rooms;
}
