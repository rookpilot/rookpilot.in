import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkSkeleton, WorkView } from "@/features/work/components/work-view";

export const metadata: Metadata = { title: "Repairs" };

export default function RepairsPage() {
  // The open repair comes from the URL, which is only known in the browser.
  return (
    <Suspense fallback={<WorkSkeleton />}>
      <WorkView kind="repair" />
    </Suspense>
  );
}
