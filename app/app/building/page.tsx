import type { Metadata } from "next";
import { Suspense } from "react";

import { BuildingSkeleton, BuildingView } from "@/features/building/components/building-view";

export const metadata: Metadata = { title: "Building" };

export default function BuildingPage() {
  // The selected room and item come from the URL, which is only known in the browser.
  return (
    <Suspense fallback={<BuildingSkeleton />}>
      <BuildingView />
    </Suspense>
  );
}
