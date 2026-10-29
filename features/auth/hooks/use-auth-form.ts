"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { HOME_PATH, ONBOARDING_PATH, safeNextPath } from "@/lib/supabase/routes";

import { authErrorMessage } from "../messages";
import type { AuthFormErrors, AuthFormValues, AuthMode } from "../types";
import { validateAuthForm } from "../validation";

const EMPTY_VALUES: AuthFormValues = { name: "", email: "", password: "" };

/** New accounts set up a building first; returning people go home, or back where they were headed. */
function afterAuthPath(mode: AuthMode) {
  if (mode === "signup") return ONBOARDING_PATH;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), HOME_PATH);
}

export function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [values, setValues] = useState<AuthFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** The address a confirmation email went to, once sign-up succeeds. */
  const [sentTo, setSentTo] = useState<string | null>(null);

  function setField<K extends keyof AuthFormValues>(field: K, value: AuthFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setFormError(null);
  }

  function reset() {
    // Next.js keeps visited pages mounted (Cache Components), so clear the form
    // before leaving or it would still be filled in when the user comes back.
    setValues(EMPTY_VALUES);
    setErrors({});
    setFormError(null);
    setSentTo(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAuthForm(mode, values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setPending(true);
    setFormError(null);
    const supabase = createClient();
    const email = values.email.trim();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: { data: { full_name: values.name.trim() } },
      });
      setPending(false);
      if (error) return setFormError(authErrorMessage(error.code));
      // With email confirmation on there's no session yet: the email link finishes sign-up.
      if (!data.session) return setSentTo(email);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: values.password });
      setPending(false);
      if (error) return setFormError(authErrorMessage(error.code));
    }

    const target = afterAuthPath(mode);
    reset();
    router.replace(target);
    router.refresh();
  }

  async function continueWithGoogle() {
    setPending(true);
    setFormError(null);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", afterAuthPath(mode));
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    // On success the browser is already leaving for Google.
    if (error) {
      setPending(false);
      setFormError(authErrorMessage(error.code));
    }
  }

  return {
    values,
    errors,
    formError,
    pending,
    sentTo,
    setField,
    handleSubmit,
    continueWithGoogle,
    /** Back to the form from the "check your email" screen. */
    startOver: reset,
  };
}
