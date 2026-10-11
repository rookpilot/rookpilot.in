import type { Metadata } from "next";

import { ComingSoon } from "@/features/shell/components/coming-soon";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <ComingSoon title="Contacts" description="The people who help keep your buildings running, what you like them for, and what they've helped with." arrivesIn="PR 4" />;
}
