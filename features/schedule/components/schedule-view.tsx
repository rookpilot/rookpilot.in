"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { NoBuilding } from "@/components/no-building";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { itemHref } from "@/features/building/routes";
import { useCurrentBuilding } from "@/features/shell/hooks/use-current-building";
import { CALENDAR_VIEWS, isCalendarView, rangeLabel, shiftAnchor, visibleRange, type CalendarView } from "@/lib/calendar";
import { selectSpaces, type AgendaEntry } from "@/lib/data/selectors";
import type { AppData } from "@/lib/data/types";
import type { Building } from "@/lib/domain/models";
import { workHref } from "@/lib/domain/work";

import { selectCalendarEvents, selectScheduleList, type CalendarEvent } from "../events";
import { useScheduleView } from "../hooks/use-schedule-view";
import { CalendarLegend } from "./event-chip";
import { MarkDoneDialog } from "./mark-done-dialog";
import { MonthCalendar } from "./month-calendar";
import { ScheduleList } from "./schedule-list";
import { WeekCalendar } from "./week-calendar";

const VIEW_LABELS: Record<CalendarView, string> = { list: "List", week: "Week", month: "Month" };

export function ScheduleView() {
  const current = useCurrentBuilding();
  if (!current) return <ScheduleSkeleton />;
  if (!current.building) return <NoBuilding />;
  return <Schedule data={current.data} building={current.building} />;
}

function Schedule({ data, building }: { data: AppData; building: Building }) {
  const router = useRouter();
  const { view, anchor, setView, goTo, showWeek } = useScheduleView(data.today);
  const [marking, setMarking] = useState<AgendaEntry[] | null>(null);
  const spaces = new Map(selectSpaces(data, building.id).map((s) => [s.id, s]));

  function openEvent(event: CalendarEvent) {
    if (event.type === "task") setMarking(event.entries);
    else if (event.type === "work") router.push(workHref(event.work.kind, event.work.id));
    else {
      const item = data.items.find((i) => i.id === event.log.itemId);
      if (item) router.push(itemHref(item.spaceId, item.id));
    }
  }

  return (
    <Page className="max-w-7xl">
      <PageHeader
        title="Schedule"
        description="Every timer in this building. Mark a task done to reset its timer."
        actions={
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            onValueChange={(value) => isCalendarView(value) && setView(value)}
            aria-label="View"
          >
            {CALENDAR_VIEWS.map((v) => (
              <ToggleGroupItem key={v} value={v} className="px-3 data-[state=on]:bg-primary-soft data-[state=on]:text-primary">
                {VIEW_LABELS[v]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      {view === "list" ? (
        <ScheduleList groups={selectScheduleList(data, building.id)} spaces={spaces} today={data.today} onMarkDone={(entry) => setMarking([entry])} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" aria-label={`Previous ${view}`} onClick={() => goTo(shiftAnchor(view, anchor, -1))}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="sm" onClick={() => goTo(data.today)}>
                Today
              </Button>
              <Button variant="outline" size="icon-sm" aria-label={`Next ${view}`} onClick={() => goTo(shiftAnchor(view, anchor, 1))}>
                <ChevronRight />
              </Button>
            </div>
            <h2 className="text-lg font-bold" aria-live="polite">
              {rangeLabel(view, anchor)}
            </h2>
          </div>
          {(() => {
            const { from, to } = visibleRange(view, anchor);
            const events = selectCalendarEvents(data, building.id, from, to);
            return view === "week" ? (
              <WeekCalendar anchor={anchor} today={data.today} events={events} onOpen={openEvent} />
            ) : (
              <MonthCalendar anchor={anchor} today={data.today} events={events} onOpen={openEvent} onShowDay={showWeek} />
            );
          })()}
          <CalendarLegend />
        </div>
      )}

      <MarkDoneDialog target={marking} onClose={() => setMarking(null)} data={data} building={building} />
    </Page>
  );
}

export function ScheduleSkeleton() {
  return (
    <Page className="max-w-7xl" aria-busy>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-96 rounded-xl" />
    </Page>
  );
}
