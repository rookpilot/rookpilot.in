import { describe, expect, it } from "vitest";

import { formatMoney, parseMoney } from "./money";

describe("money", () => {
  it("reads what people type", () => {
    expect(parseMoney("240")).toBe(240);
    expect(parseMoney("$1,200")).toBe(1200);
    expect(parseMoney("6.5")).toBe(6.5);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });

  it("drops cents only when there are none", () => {
    expect(formatMoney(240)).toBe("$240");
    expect(formatMoney(14200)).toBe("$14,200");
    expect(formatMoney(6.5)).toBe("$6.50");
  });
});
