"use client";

import { Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ChatMessage } from "../hooks/use-stub-chat";
import { ChatInput } from "./chat-input";

/** Examples from the Rookpilot doc, shown before the first message. */
const SUGGESTIONS = ["I changed the air filter", "The garage door is grinding when it opens", "What's due this week?"];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  /** Taking up the whole page, with the conversation centered. */
  expanded?: boolean;
  /** Shows the expand / collapse button. Left out on phones, where chat is already full screen. */
  onToggleExpanded?: () => void;
}

/** The chat column: header, messages that scroll, and the input pinned to the bottom. */
export function ChatPanel({ messages, onSend, onClose, expanded = false, onToggleExpanded }: ChatPanelProps) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <section aria-label="Chat with Rookpilot" className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-background">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Rookpilot</h2>
          <p className="text-xs text-muted-foreground">Assistant · coming soon</p>
        </div>
        {onToggleExpanded && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground"
            aria-label={expanded ? "Shrink chat to the side" : "Expand chat to full screen"}
            title={expanded ? "Shrink (Esc)" : "Expand"}
            onClick={onToggleExpanded}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground" aria-label="Close chat" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className={cn("flex min-h-full flex-col gap-3 p-4", expanded && "mx-auto w-full max-w-3xl py-8")}>
          {messages.length === 0 ? (
            <div className={cn("m-auto flex flex-col items-center gap-4 text-center", expanded ? "max-w-md" : "max-w-xs")}>
              <p className={cn("font-heading font-bold", expanded ? "text-3xl" : "text-xl")}>How can I help?</p>
              <p className="text-sm text-muted-foreground">Tell Rookpilot what you fixed, or ask what&apos;s next.</p>
              <div className="flex flex-col items-stretch gap-2 self-stretch">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSend(s)}
                    className="rounded-xl border bg-card px-3 py-2 text-left text-sm shadow-xs transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <p
                key={m.id}
                className={cn(
                  "max-w-[85%] animate-in rounded-2xl px-3.5 py-2 text-sm duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none",
                  m.role === "user"
                    ? "self-end rounded-br-md bg-foreground text-background"
                    : "self-start rounded-bl-md bg-muted text-muted-foreground",
                )}
              >
                {m.text}
              </p>
            ))
          )}
          <div ref={end} />
        </div>
      </div>

      <div className={cn("p-3 pt-0", expanded && "mx-auto w-full max-w-3xl pb-6")}>
        <ChatInput onSend={onSend} />
      </div>
    </section>
  );
}
