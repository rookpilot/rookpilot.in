import { describe, expect, it } from "vitest";

import { authRedirect, safeNextPath } from "./routes";

describe("authRedirect", () => {
  it("sends signed-out people from private pages to log in, remembering where they were going", () => {
    expect(authRedirect("/app/schedule", "?view=week", false)).toBe("/login?next=%2Fapp%2Fschedule%3Fview%3Dweek");
    expect(authRedirect("/onboarding", "", false)).toBe("/login?next=%2Fonboarding");
  });

  it("sends signed-in people away from log in and sign up", () => {
    expect(authRedirect("/login", "", true)).toBe("/app");
    expect(authRedirect("/signup", "", true)).toBe("/app");
  });

  it("starts the site at the app or at sign-up", () => {
    expect(authRedirect("/", "", true)).toBe("/app");
    expect(authRedirect("/", "", false)).toBe("/signup");
  });

  it("lets everything else through", () => {
    expect(authRedirect("/app", "", true)).toBeNull();
    expect(authRedirect("/login", "", false)).toBeNull();
    expect(authRedirect("/auth/callback", "?code=x", false)).toBeNull();
    expect(authRedirect("/applications", "", false)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/app/contacts?id=1", "/app")).toBe("/app/contacts?id=1");
  });

  it("falls back for missing values and other sites", () => {
    expect(safeNextPath(null, "/app")).toBe("/app");
    expect(safeNextPath("https://evil.example", "/app")).toBe("/app");
    expect(safeNextPath("//evil.example", "/app")).toBe("/app");
    expect(safeNextPath("/\\evil.example", "/app")).toBe("/app");
  });
});
