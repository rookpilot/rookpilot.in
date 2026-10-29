import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";
import { authRedirect } from "./routes";

/**
 * Refreshes the login on every request so Server Components see a valid session,
 * then keeps signed-out people out of the app and signed-in people off the log-in pages.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  // Nothing may run between creating the client and this call, or people get logged out at random.
  const { data } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  const target = authRedirect(pathname, search, Boolean(data?.claims));
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    // Carry the refreshed cookies over, or the browser and server fall out of sync.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  // Return this exact response: it carries the refreshed cookies.
  return response;
}
