import type { Metadata } from "next";
import { Suspense } from "react";

import { ScheduleSkeleton, ScheduleView } from "@/features/schedule/components/schedule-view";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  // The view and date come from the URL, which is only known in the browser.
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleView />
    </Suspense>
  );
}
