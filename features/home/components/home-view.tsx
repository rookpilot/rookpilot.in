"use client";

import Link from "next/link";
import { useState } from "react";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { NoBuilding } from "@/components/no-building";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkDoneDialog } from "@/features/schedule/components/mark-done-dialog";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { BUILDING_TYPE_INFO, formatAddressLine } from "@/lib/domain/building";
import { selectAgenda, selectBuildingSummary, selectSpaces, selectWork, type AgendaEntry } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building } from "@/lib/domain/models";
import { isFinished } from "@/lib/domain/work";

import { AskBar } from "./ask-bar";
import { InProgressList } from "./in-progress-list";
import { NextUpList } from "./next-up-list";
import { SummaryCards } from "./summary-cards";

const NEXT_UP_COUNT = 5;
const IN_PROGRESS_COUNT = 4;

export function HomeView() {
  const current = useCurrentBuilding();
  if (!current) return <HomeSkeleton />;

  if (!current.building) return <NoBuilding />;
  return <Home data={current.data} building={current.building} />;
}

/** "Good morning", "Good afternoon", or "Good evening" for the visitor's clock. */
function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Home({ data, building }: { data: AppData; building: Building }) {
  const [marking, setMarking] = useState<AgendaEntry[] | null>(null);
  const summary = selectBuildingSummary(data, building.id);
  const nextUp = selectAgenda(data, building.id).slice(0, NEXT_UP_COUNT);
  const spaces = new Map(selectSpaces(data, building.id).map((s) => [s.id, s]));
  const open = [...selectWork(data, building.id, "repair"), ...selectWork(data, building.id, "project")]
    .filter((w) => !isFinished(w))
    .slice(0, IN_PROGRESS_COUNT);

  return (
    <Page className="max-w-5xl gap-8">
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow={`${greeting(new Date().getHours())} · ${BUILDING_TYPE_INFO[building.type].label}`}
          title={building.name}
          description={`${formatAddressLine(building.address)}, ${building.address.city}, ${building.address.region}`}
        />
        <AskBar />
      </div>

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3" aria-labelledby="next-up-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="next-up-heading" className="text-lg font-bold">
              Next up
            </h2>
            <Link href="/app/schedule" className="text-sm text-muted-foreground hover:text-foreground">
              Full schedule →
            </Link>
          </div>
          <NextUpList entries={nextUp} today={data.today} onMarkDone={(entry) => setMarking([entry])} />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="in-progress-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="in-progress-heading" className="text-lg font-bold">
              In progress
            </h2>
            <Link href="/app/repairs" className="text-sm text-muted-foreground hover:text-foreground">
              Repairs →
            </Link>
          </div>
          <InProgressList work={open} spaces={spaces} />
        </section>
      </div>

      <MarkDoneDialog target={marking} onClose={() => setMarking(null)} data={data} building={building} />
    </Page>
  );
}

function HomeSkeleton() {
  return (
    <Page className="max-w-5xl" aria-busy>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </Page>
  );
}
