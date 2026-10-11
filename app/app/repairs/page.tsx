import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Repairs" };

export default function RepairsPage() {
  return <ComingSoon title="Repairs" description="Things that broke and how they got fixed. Track cost, DIY or hired, and who helped." arrivesIn="PR 5" />;
}
