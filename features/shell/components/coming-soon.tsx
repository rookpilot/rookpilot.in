import { Construction } from "lucide-react";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";

interface ComingSoonProps {
  title: string;
  description: string;
  /** Which planned pull request adds this tab. */
  arrivesIn: string;
}

export function ComingSoon({ title, description, arrivesIn }: ComingSoonProps) {
  return (
    <Page>
      <PageHeader title={title} />
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <Construction className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        <p className="font-mono text-xs text-muted-foreground">Arrives in {arrivesIn}</p>
      </div>
    </Page>
  );
}
