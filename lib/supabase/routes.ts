/** Pages that need a signed-in account. */
const PRIVATE_PREFIXES = ["/app", "/onboarding"];
/** Pages only for signed-out people. */
const AUTH_PAGES = ["/login", "/signup"];

export const HOME_PATH = "/app";
export const LOGIN_PATH = "/login";
export const ONBOARDING_PATH = "/onboarding";
export const SIGNUP_PATH = "/signup";

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Where proxy.ts should send this request instead, or null to let it through. */
export function authRedirect(pathname: string, search: string, signedIn: boolean): string | null {
  // There's no landing page yet: the site starts at the app or at sign-up.
  if (pathname === "/") return signedIn ? HOME_PATH : SIGNUP_PATH;
  if (!signedIn && PRIVATE_PREFIXES.some((p) => matches(pathname, p))) {
    return `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`;
  }
  if (signedIn && AUTH_PAGES.some((p) => matches(pathname, p))) {
    return HOME_PATH;
  }
  return null;
}

/** A ?next= value that's safe to redirect to: a path on this site, never another site. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
