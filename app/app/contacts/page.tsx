import type { Metadata } from "next";
import { Suspense } from "react";

import { ContactsSkeleton, ContactsView } from "@/features/contacts/components/contacts-view";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  // The open contact comes from the URL, which is only known in the browser.
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsView />
    </Suspense>
  );
}
