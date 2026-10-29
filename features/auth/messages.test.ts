import { describe, expect, it } from "vitest";

import { authErrorMessage, urlErrorMessage } from "./messages";

describe("authErrorMessage", () => {
  it("explains known errors", () => {
    expect(authErrorMessage("invalid_credentials")).toMatch(/don't match/);
  });

  it("falls back for unknown or missing codes", () => {
    expect(authErrorMessage("something_new")).toMatch(/Something went wrong/);
    expect(authErrorMessage(undefined)).toMatch(/Something went wrong/);
  });
});

describe("urlErrorMessage", () => {
  it("explains known ?error= values and ignores the rest", () => {
    expect(urlErrorMessage("link")).toMatch(/expired/);
    expect(urlErrorMessage("whatever")).toBeNull();
    expect(urlErrorMessage(null)).toBeNull();
  });
});
