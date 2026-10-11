import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Home" };

/** Placeholder until the app shell lands in PR 2. */
export default function AppHomePlaceholder() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo href="/app" />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re all set</h1>
        <p className="text-muted-foreground">
          This is where Home will go: what&apos;s due, your rooms and items, and the chat. It arrives in the next pull request.
          Nothing from onboarding is saved yet.
        </p>
      </div>
      <Button asChild variant="outline" size="lg">
        <Link href="/onboarding">Go through onboarding again</Link>
      </Button>
    </div>
  );
}
