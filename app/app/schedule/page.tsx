import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  return <ComingSoon title="Schedule" description="Every timer in your building as a list, or on a week or month calendar. Mark tasks done to reset their timers." arrivesIn="PR 3" />;
}
