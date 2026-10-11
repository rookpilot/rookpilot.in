"use client";

import Link from "next/link";

import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useAuthForm } from "../hooks/use-auth-form";
import type { AuthMode } from "../types";
import { MIN_PASSWORD_LENGTH } from "../validation";
import { GoogleIcon } from "./google-icon";

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string; switchPrompt: string; switchLabel: string; switchHref: string }> = {
  signup: {
    title: "Create your account",
    subtitle: "Set up your building in a few minutes.",
    submit: "Create account",
    switchPrompt: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
  login: {
    title: "Welcome back",
    subtitle: "Log in to see what's due.",
    submit: "Log in",
    switchPrompt: "New to Rookpilot?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
};

export function AuthCard({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];
  const { values, errors, setField, handleSubmit, continueWithGoogle } = useAuthForm(mode);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <Button type="button" variant="outline" size="lg" className="h-10" onClick={continueWithGoogle}>
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        or with email
        <Separator className="flex-1" />
      </div>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <FormField
            label="Name"
            autoComplete="name"
            value={values.name}
            error={errors.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        )}
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(e) => setField("email", e.target.value)}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={values.password}
          error={errors.password}
          hint={mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
          onChange={(e) => setField("password", e.target.value)}
        />
        <Button type="submit" size="lg" className="mt-1 h-10">
          {copy.submit}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {copy.switchPrompt}{" "}
        <Link href={copy.switchHref} className="font-semibold text-primary underline-offset-4 hover:underline">
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}
