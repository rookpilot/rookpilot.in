import { describe, expect, it } from "vitest";
import { confirmLevel, DEFAULT_CONFIRM_LEVEL, needsConfirmation } from "./confirm";

describe("needsConfirmation", () => {
  it("never asks before a read", () => {
    expect(needsConfirmation("read", true)).toBe(false);
  });

  it("always asks before a delete, even if Claude didn't", () => {
    expect(needsConfirmation("delete", false)).toBe(true);
  });

  it("asks before a write only when Claude asked first", () => {
    expect(needsConfirmation("write", true)).toBe(true);
    expect(needsConfirmation("write", false)).toBe(false);
  });
});

describe("confirmLevel", () => {
  it("uses the default until the person picks a level", () => {
    expect(confirmLevel(undefined)).toBe(DEFAULT_CONFIRM_LEVEL);
    expect(confirmLevel({ buildingId: "b1" })).toBe(DEFAULT_CONFIRM_LEVEL);
  });

  it("keeps the level between 0 and 100", () => {
    expect(confirmLevel({ confirmLevel: 70 })).toBe(70);
    expect(confirmLevel({ confirmLevel: 140 })).toBe(100);
    expect(confirmLevel({ confirmLevel: -5 })).toBe(0);
  });
});
