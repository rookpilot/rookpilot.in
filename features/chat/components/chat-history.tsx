"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { groupChats, type ChatSummary } from "../chat-groups";

interface ChatHistoryProps {
  /** Null while loading. */
  chats: ChatSummary[] | null;
  /** The chat that's open, highlighted in the list. */
  currentId: string | null;
  onOpen: (id: string) => void;
  className?: string;
}

/** The past chats, searchable and grouped by Today, Yesterday, Last 7 days and Older. */
export function ChatHistory({ chats, currentId, onOpen, className }: ChatHistoryProps) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const groups = groupChats((chats ?? []).filter((chat) => chat.title.toLowerCase().includes(search)));

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <label className="flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-card px-2.5 text-sm text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50">
        <Search className="size-4" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        {chats === null ? (
          <div className="flex flex-col gap-2 pt-3" aria-label="Loading chats">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 pt-6 text-center text-sm text-muted-foreground">
            {search ? "No chats match that." : "No chats yet. Your conversations with Rookpilot show up here."}
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5 pb-2">
              <h3 className="px-2 pt-3 pb-1 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{group.label}</h3>
              {group.chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => onOpen(chat.id)}
                  aria-current={chat.id === currentId ? "page" : undefined}
                  title={chat.title}
                  className={cn(
                    "truncate rounded-lg px-2 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    chat.id === currentId ? "bg-muted font-medium text-foreground" : "text-foreground/80 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {chat.title}
                </button>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
