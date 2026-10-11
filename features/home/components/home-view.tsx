"use client";

import Link from "next/link";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { formatAddressLine } from "@/lib/domain/building";
import { selectAgenda, selectBuildingSummary } from "@/lib/data/selectors";

import { NextUpList } from "./next-up-list";
import { SummaryCards } from "./summary-cards";

const NEXT_UP_COUNT = 5;

export function HomeView() {
  const current = useCurrentBuilding();
  if (!current) return <HomeSkeleton />;

  const { data, building } = current;
  if (!building) return <NoBuilding />;

  const summary = selectBuildingSummary(data, building.id);
  const nextUp = selectAgenda(data, building.id).slice(0, NEXT_UP_COUNT);

  return (
    <Page>
      <PageHeader
        title={building.name}
        description={`${formatAddressLine(building.address)}, ${building.address.city}, ${building.address.region}`}
      />
      <SummaryCards summary={summary} />

      <section className="flex flex-col gap-3" aria-labelledby="next-up-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="next-up-heading" className="text-lg font-bold">
            Next up
          </h2>
          <Link href="/app/schedule" className="text-sm font-medium text-primary hover:underline">
            Full schedule
          </Link>
        </div>
        <NextUpList entries={nextUp} today={data.today} />
      </section>

      <ChatPanel />
    </Page>
  );
}

function HomeSkeleton() {
  return (
    <Page aria-busy>
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </Page>
  );
}

function NoBuilding() {
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
