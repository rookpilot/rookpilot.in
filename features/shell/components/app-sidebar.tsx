import { LogOut } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

import { BuildingSwitcher } from "./building-switcher";
import { SidebarNav } from "./sidebar-nav";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Logo href="/app" className="h-6 px-1" />
      <BuildingSwitcher />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <Link
        href="/login"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </Link>
    </div>
  );
}
