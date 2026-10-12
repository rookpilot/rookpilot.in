"use client";

import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useShell } from "../shell-context";
import { BuildingSwitcher } from "./building-switcher";
import { SidebarNav } from "./sidebar-nav";

interface AppSidebarProps {
  collapsed?: boolean;
  /** Shows the collapse button (wide screens only). */
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, onToggleCollapsed, onNavigate }: AppSidebarProps) {
  const { openSearch } = useShell();

  return (
    <div className={cn("flex h-full flex-col gap-4 py-4", collapsed ? "px-2.5" : "px-3")}>
      <div className={cn("flex h-8 items-center gap-2", collapsed ? "justify-center" : "justify-between pl-1.5")}>
        {collapsed ? <LogoMark href="/app" /> : <Logo href="/app" className="h-6" />}
        {onToggleCollapsed && !collapsed && (
          <SidebarIconButton label="Collapse sidebar" shortcut="⌘B" onClick={onToggleCollapsed}>
            <PanelLeftClose />
          </SidebarIconButton>
        )}
      </div>

      <BuildingSwitcher collapsed={collapsed} />

      <SearchButton collapsed={collapsed} onClick={() => {
        onNavigate?.();
        openSearch();
      }} />

      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
        {onToggleCollapsed && collapsed && (
          <SidebarIconButton label="Expand sidebar" shortcut="⌘B" onClick={onToggleCollapsed}>
            <PanelLeftOpen />
          </SidebarIconButton>
        )}
        <ThemeToggle />
        {collapsed ? (
          <SidebarIconButton label="Log out" href="/login">
            <LogOut />
          </SidebarIconButton>
        ) : (
          <Button asChild variant="ghost" size="sm" className="ml-auto text-muted-foreground">
            <Link href="/login">
              <LogOut data-icon="inline-start" />
              Log out
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function SearchButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <SidebarIconButton label="Search" shortcut="⌘K" onClick={onClick}>
          <Search />
        </SidebarIconButton>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="rounded border bg-background px-1.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser, so the label stays the same on the server and client.
  return (
    <SidebarIconButton label="Toggle dark mode" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </SidebarIconButton>
  );
}

interface SidebarIconButtonProps {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}

function SidebarIconButton({ label, shortcut, onClick, href, children }: SidebarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button asChild variant="ghost" size="icon" className="text-muted-foreground" aria-label={label}>
            <Link href={href}>{children}</Link>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {shortcut && <kbd className="ml-2 font-mono text-[10px] opacity-70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
