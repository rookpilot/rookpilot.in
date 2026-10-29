"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useAuthForm } from "../hooks/use-auth-form";
import { urlErrorMessage } from "../messages";
import type { AuthMode } from "../types";
import { MIN_PASSWORD_LENGTH } from "../validation";
import { GoogleIcon } from "./google-icon";

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string; pending: string; switchPrompt: string; switchLabel: string; switchHref: string }> = {
  signup: {
    title: "Create your account",
    subtitle: "Set up your building in a few minutes.",
    submit: "Create account",
    pending: "Creating account…",
    switchPrompt: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
  login: {
    title: "Welcome back",
    subtitle: "Log in to see what's due.",
    submit: "Log in",
    pending: "Logging in…",
    switchPrompt: "New to Rookpilot?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
};

export function AuthCard({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];
  const { values, errors, formError, pending, sentTo, setField, handleSubmit, continueWithGoogle, startOver } = useAuthForm(mode);

  if (sentTo) return <CheckEmail email={sentTo} onStartOver={startOver} />;

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <Suspense>
        <UrlError />
      </Suspense>

      <Button type="button" variant="outline" size="lg" className="h-10" disabled={pending} onClick={continueWithGoogle}>
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
        {formError && <FormError>{formError}</FormError>}
        <Button type="submit" size="lg" className="mt-1 h-10" disabled={pending}>
          {pending ? copy.pending : copy.submit}
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

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}

/** Shows why someone landed back here, e.g. an expired email link. Reads the URL, so it renders in Suspense. */
function UrlError() {
  const message = urlErrorMessage(useSearchParams().get("error"));
  return message ? <FormError>{message}</FormError> : null;
}

function CheckEmail({ email, onStartOver }: { email: string; onStartOver: () => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <MailCheck className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a link to <span className="font-medium text-foreground">{email}</span>. Open it to confirm your account and set up your first
          building.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Wrong address?{" "}
        <button type="button" onClick={onStartOver} className="font-semibold text-primary underline-offset-4 hover:underline">
          Start over
        </button>
      </p>
    </div>
  );
}
