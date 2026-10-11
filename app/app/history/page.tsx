import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return <ComingSoon title="History" description="Everything you've finished, newest first: tasks, repairs, and projects." arrivesIn="PR 6" />;
}
