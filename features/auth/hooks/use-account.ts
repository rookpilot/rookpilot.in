"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { LOGIN_PATH } from "@/lib/supabase/routes";

export interface Account {
  email: string;
  name: string;
}

/** The signed-in account, or null while loading. */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Fires right away with the current session, then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAccount(user ? { email: user.email ?? "", name: String(user.user_metadata.full_name ?? "") } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return account;
}

/** Signs out and goes to the log-in page. */
export function useSignOut() {
  const router = useRouter();
  return async function signOut() {
    await createClient().auth.signOut();
    router.replace(LOGIN_PATH);
    router.refresh();
  };
}
