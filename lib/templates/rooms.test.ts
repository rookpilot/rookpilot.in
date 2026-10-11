import { describe, expect, it } from "vitest";

import { suggestRooms } from "./rooms";

const names = (type: Parameters<typeof suggestRooms>[0], beds = "", baths = "") =>
  suggestRooms(type, { beds, baths }).map((room) => room.name);

describe("suggestRooms", () => {
  it("builds the doc's example 3-bed, 2-bath house", () => {
    expect(names("house", "3", "2")).toEqual([
      "Whole building",
      "Master bedroom",
      "Bedroom 1",
      "Bedroom 2",
      "Master bath",
      "Hall bath",
      "Kitchen",
      "Living room",
      "Hallway",
      "Laundry",
      "Garage",
      "Garden",
    ]);
  });

  it("always starts with the whole-building room", () => {
    for (const type of ["house", "apartment_condo", "gym", null] as const) {
      expect(suggestRooms(type, { beds: "", baths: "" })[0].kind).toBe("whole_building");
    }
  });

  it("uses sensible defaults when bed and bath counts are skipped", () => {
    expect(names("house")).toContain("Bedroom 1");
    expect(names("apartment_condo")).not.toContain("Bedroom 1");
    expect(names("apartment_condo")).toContain("Master bedroom");
  });

  it("leaves out laundry, garage, and garden for apartments", () => {
    const rooms = names("apartment_condo", "2", "1");
    expect(rooms).not.toContain("Laundry");
    expect(rooms).not.toContain("Garage");
    expect(rooms).not.toContain("Garden");
  });

  it("caps very large counts", () => {
    expect(names("house", "99", "1").filter((n) => n.startsWith("Bedroom") || n === "Master bedroom")).toHaveLength(10);
  });

  it("gives commercial buildings their own rooms", () => {
    expect(names("theater")).toEqual(["Whole building", "Auditorium", "Lobby", "Concession stand", "Restrooms"]);
  });
});
