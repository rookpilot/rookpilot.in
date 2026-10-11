import { describe, expect, it } from "vitest";

import { initials, normalizeInstagram } from "./contact";

describe("contact helpers", () => {
  it("makes initials from the first two words", () => {
    expect(initials("Dana Ruiz")).toBe("DR");
    expect(initials("Top Shelf Roofing")).toBe("TS");
    expect(initials("  priya ")).toBe("P");
  });

  it("stores Instagram handles without the @ or link", () => {
    expect(normalizeInstagram("@ruizdoors")).toBe("ruizdoors");
    expect(normalizeInstagram("https://www.instagram.com/ruizdoors/?hl=en")).toBe("ruizdoors");
    expect(normalizeInstagram(" marcobuilds ")).toBe("marcobuilds");
  });
});
