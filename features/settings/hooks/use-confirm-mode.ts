"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CONFIRM_MODES, DEFAULT_CONFIRM_MODE, type ConfirmMode } from "@/lib/agent/confirm";
import { createClient } from "@/lib/supabase/client";

const isMode = (value: unknown): value is ConfirmMode => CONFIRM_MODES.includes(value as ConfirmMode);

/**
 * The person's chat level, saved on their profile. Null while loading. The chat reads it on the
 * server for every message, so a change applies from the next message on.
 */
export function useConfirmMode() {
  const [mode, setMode] = useState<ConfirmMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: claims } = await supabase.auth.getClaims();
      const userId = claims?.claims.sub;
      if (!userId) return;
      const { data } = await supabase.from("profiles").select("confirm_mode").eq("id", userId).maybeSingle();
      if (!cancelled) setMode(isMode(data?.confirm_mode) ? data.confirm_mode : DEFAULT_CONFIRM_MODE);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Shows the new level right away, and goes back if saving fails. */
  async function save(next: ConfirmMode) {
    const previous = mode;
    setMode(next);
    const supabase = createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    const { error } = userId ? await supabase.from("profiles").update({ confirm_mode: next }).eq("id", userId) : { error: new Error("Signed out") };
    if (error) {
      console.error("Saving the chat level failed", error);
      toast.error("Couldn't save that. Try again.");
      setMode(previous);
    }
  }

  return { mode, save };
}
