import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ComingSoon title="Projects" description="Things you're adding or improving, like a fire pit or new paint. Track cost, DIY or hired, and who helped." arrivesIn="PR 5" />;
}
