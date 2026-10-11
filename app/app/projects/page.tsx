import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkSkeleton, WorkView } from "@/features/work/components/work-view";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  // The open project comes from the URL, which is only known in the browser.
  return (
    <Suspense fallback={<WorkSkeleton />}>
      <WorkView kind="project" />
    </Suspense>
  );
}
