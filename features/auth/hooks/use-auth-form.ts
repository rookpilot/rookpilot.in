"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AuthFormErrors, AuthFormValues, AuthMode } from "../types";
import { validateAuthForm } from "../validation";

const EMPTY_VALUES: AuthFormValues = { name: "", email: "", password: "" };

/** Where every auth path lands until real accounts exist (phase 2). */
const AFTER_AUTH_PATH = "/onboarding";

export function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [values, setValues] = useState<AuthFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AuthFormErrors>({});

  function setField<K extends keyof AuthFormValues>(field: K, value: AuthFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function continueToApp() {
    // Next.js keeps visited pages mounted (Cache Components), so clear the form
    // before leaving or it would still be filled in when the user comes back.
    setValues(EMPTY_VALUES);
    setErrors({});
    router.push(AFTER_AUTH_PATH);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAuthForm(mode, values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    continueToApp();
  }

  return {
    values,
    errors,
    setField,
    handleSubmit,
    /** Google sign-in is a placeholder: it skips the form and continues. */
    continueWithGoogle: continueToApp,
  };
}
