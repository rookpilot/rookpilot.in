"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useLocalPreference } from "@/hooks/use-local-preference";
import { isCalendarView, type CalendarView } from "@/lib/calendar";
import type { ISODate } from "@/lib/domain/models";

import { scheduleHref } from "../routes";

const VIEW_KEY = "rookpilot.schedule.view";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which view and which week or month the Schedule shows. Both live in the URL so
 * back and links work; with no view in the URL, the last one picked is used.
 */
export function useScheduleView(today: ISODate) {
  const router = useRouter();
  const params = useSearchParams();
  const [stored, setStored] = useLocalPreference(VIEW_KEY);

  const viewParam = params.get("view");
  const dateParam = params.get("date");
  const view: CalendarView = isCalendarView(viewParam) ? viewParam : isCalendarView(stored) ? stored : "list";
  const anchor: ISODate = dateParam && ISO_DATE.test(dateParam) ? dateParam : today;

  const go = (nextView: CalendarView, date: ISODate) => router.replace(scheduleHref(nextView, date), { scroll: false });

  return {
    view,
    anchor,
    setView(next: CalendarView) {
      setStored(next);
      go(next, anchor);
    },
    goTo: (date: ISODate) => go(view, date),
    /** Opens the week containing a day, from a month's "+2 more". */
    showWeek(date: ISODate) {
      setStored("week");
      go("week", date);
    },
  };
}
