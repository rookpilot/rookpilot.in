import { describe, expect, it } from "vitest";
import { confirmMode, DEFAULT_CONFIRM_MODE, needsConfirmation, type ChangeType, type ConfirmMode } from "./confirm";

describe("needsConfirmation", () => {
  // The table in confirm.ts, as a test: which changes get a card at each level.
  const table: Record<ChangeType, Record<ConfirmMode, boolean>> = {
    delete: { rarely: true, sometimes: true, always: true },
    new: { rarely: false, sometimes: true, always: true },
    edit: { rarely: false, sometimes: true, always: true },
    quick: { rarely: false, sometimes: false, always: true },
  };

  for (const [change, modes] of Object.entries(table)) {
    for (const [mode, expected] of Object.entries(modes)) {
      it(`${expected ? "shows" : "skips"} the card for a ${change} change at ${mode}`, () => {
        expect(needsConfirmation(mode as ConfirmMode, change as ChangeType, false)).toBe(expected);
      });
    }
  }

  it("always shows the card when Claude guessed something", () => {
    expect(needsConfirmation("rarely", "quick", true)).toBe(true);
    expect(needsConfirmation("rarely", "new", true)).toBe(true);
  });
});

describe("confirmMode", () => {
  it("uses the default until the person picks a level", () => {
    expect(confirmMode(undefined)).toBe(DEFAULT_CONFIRM_MODE);
    expect(confirmMode({ buildingId: "b1" })).toBe("sometimes");
  });

  it("uses the person's level, and ignores anything that isn't one", () => {
    expect(confirmMode({ confirmMode: "always" })).toBe("always");
    expect(confirmMode({ confirmMode: "loud" as never })).toBe("sometimes");
  });
});
