"use client";

import Link from "next/link";
import { useState } from "react";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { NoBuilding } from "@/components/no-building";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { MarkDoneDialog } from "@/features/schedule/components/mark-done-dialog";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { BUILDING_TYPE_INFO, formatAddressLine } from "@/lib/domain/building";
import { selectAgenda, selectBuildingSummary, type AgendaEntry } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building } from "@/lib/domain/models";

import { NextUpList } from "./next-up-list";
import { SummaryCards } from "./summary-cards";

const NEXT_UP_COUNT = 5;

export function HomeView() {
  const current = useCurrentBuilding();
  if (!current) return <HomeSkeleton />;

  if (!current.building) return <NoBuilding />;
  return <Home data={current.data} building={current.building} />;
}

function Home({ data, building }: { data: AppData; building: Building }) {
  const [marking, setMarking] = useState<AgendaEntry[] | null>(null);
  const summary = selectBuildingSummary(data, building.id);
  const nextUp = selectAgenda(data, building.id).slice(0, NEXT_UP_COUNT);

  return (
    <Page>
      <PageHeader
        eyebrow={BUILDING_TYPE_INFO[building.type].label}
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
        <NextUpList entries={nextUp} today={data.today} onMarkDone={(entry) => setMarking([entry])} />
      </section>

      <ChatPanel />
      <MarkDoneDialog target={marking} onClose={() => setMarking(null)} data={data} building={building} />
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
