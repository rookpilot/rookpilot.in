import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { HOME_PATH, LOGIN_PATH, safeNextPath } from "@/lib/supabase/routes";

/** Google sends people back here after they pick an account. It finishes the sign-in. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), HOME_PATH);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL(`${LOGIN_PATH}?error=google`, request.url));
}
