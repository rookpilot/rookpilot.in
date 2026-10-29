import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/** Supabase for Client Components. Reads and writes the login cookie in the browser. */
export function createClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
