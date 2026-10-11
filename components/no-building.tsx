import Link from "next/link";

import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

/** Shown on every building tab when the account has no buildings. */
export function NoBuilding() {
  return (
    <Page className="items-center justify-center text-center">
      <h1 className="text-2xl font-bold">Add your first building</h1>
      <p className="text-muted-foreground">Set up a building to start tracking its maintenance.</p>
      <Button asChild size="lg">
        <Link href="/onboarding">Set up a building</Link>
      </Button>
    </Page>
  );
}
