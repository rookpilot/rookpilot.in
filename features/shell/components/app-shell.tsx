"use client";

import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ChatLauncher } from "@/features/chat/components/chat-launcher";
import { ChatPanel } from "@/features/chat/components/chat-panel";
import { useStubChat } from "@/features/chat/hooks/use-stub-chat";
import { CommandMenu } from "@/features/command/components/command-menu";
import { useHotkey } from "@/hooks/use-hotkey";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { useSidebarCollapsed } from "../hooks/use-sidebar-collapsed";
import { ShellProvider } from "../shell-context";
import { AppSidebar } from "./app-sidebar";

/**
 * Wide screens: a collapsible sidebar, the page on a raised panel, and a chat panel that docks on the right.
 * Phones: a top bar with a slide-out menu, and chat as a full-screen sheet.
 * Shortcuts: ⌘B sidebar, ⌘J chat, ⌘K search.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Closed, docked on the right, or taking over the page (wide screens only).
  const [chatMode, setChatMode] = useState<"closed" | "docked" | "full">("closed");
  const chatOpen = chatMode !== "closed";
  const setChatOpen = (open: boolean) => setChatMode(open ? (chatMode === "closed" ? "docked" : chatMode) : "closed");
  const expanded = chatMode === "full";

  // Going to another page while chat is full screen shrinks it to the side, so the page shows.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (expanded) setChatMode("docked");
  }
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const chat = useStubChat();
  // Matches Tailwind's lg breakpoint, where the chat docks instead of covering the page.
  const wide = useMediaQuery("(min-width: 1024px)");

  useHotkey("b", toggleCollapsed);
  useHotkey("j", () => setChatMode((mode) => (mode === "closed" ? "docked" : "closed")));

  // Esc shrinks a full-screen chat back to the side, unless a dialog or menu is handling it.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector("[role=dialog]")) setChatMode("docked");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);
  useHotkey("k", () => setSearchOpen((open) => !open));

  const controls = {
    openChat(prompt?: string) {
      setChatOpen(true);
      if (prompt) chat.send(prompt);
    },
    openSearch: () => setSearchOpen(true),
  };

  return (
    <ShellProvider value={controls}>
      <div className="flex h-svh bg-sidebar">
        <aside
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none lg:block",
            collapsed ? "w-[68px]" : "w-64",
          )}
        >
          <AppSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 gap-2 lg:py-2 lg:pr-2">
          <div
            id="app-content"
            className={cn(
              "flex min-w-0 flex-1 flex-col overflow-y-auto bg-background lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm",
              // Full-screen chat covers the page; it stays mounted so its state survives.
              expanded && wide && "hidden",
            )}
          >
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                <Menu />
              </Button>
              <Logo href="/app" className="h-6" />
              <Button variant="ghost" size="icon" className="ml-auto" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <Search />
              </Button>
            </header>
            {children}
            {/* Room for the floating chat button below the last row. */}
            <div className="h-20 shrink-0" aria-hidden="true" />
          </div>

          {/* Docked chat on wide screens. Kept mounted while closed so the conversation stays. */}
          <aside
            aria-hidden={!chatOpen}
            inert={!chatOpen}
            className={cn(
              "hidden shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none lg:block",
              !chatOpen && "w-0 border-0 opacity-0",
              chatOpen && !expanded && "w-[380px] opacity-100",
              expanded && "flex-1 animate-in opacity-100 duration-300 fade-in-0 zoom-in-[0.98] motion-reduce:animate-none",
            )}
          >
            <div className={cn("h-full", expanded ? "w-full" : "w-[380px]")}>
              <ChatPanel
                messages={chat.messages}
                onSend={chat.send}
                onClose={() => setChatOpen(false)}
                expanded={expanded}
                onToggleExpanded={() => setChatMode(expanded ? "docked" : "full")}
              />
            </div>
          </aside>
        </div>

        <ChatLauncher hidden={chatOpen} onClick={() => setChatOpen(true)} />

        <Sheet open={menuOpen && !wide} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <AppSidebar onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Chat on phones. */}
        <Sheet open={chatOpen && !wide} onOpenChange={setChatOpen}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md" showCloseButton={false}>
            <SheetTitle className="sr-only">Chat with Rookpilot</SheetTitle>
            <ChatPanel messages={chat.messages} onSend={chat.send} onClose={() => setChatOpen(false)} />
          </SheetContent>
        </Sheet>

        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} onAskRookpilot={() => setChatOpen(true)} />
      </div>
    </ShellProvider>
  );
}
