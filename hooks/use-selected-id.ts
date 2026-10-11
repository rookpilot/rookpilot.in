"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * The open record in a list → detail page, kept in the URL as ?id= so links,
 * refresh, and back all work.
 */
export function useSelectedId() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return {
    selectedId: params.get("id"),
    select: (id: string) => router.replace(`${pathname}?id=${encodeURIComponent(id)}`, { scroll: false }),
    clear: () => router.replace(pathname, { scroll: false }),
  };
}
