import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <ComingSoon title="Settings" description="Edit your building's details, add or delete buildings, and sign out." arrivesIn="PR 6" />;
}
