"use client";

import { Maximize2, Minimize2, SquarePen, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Decisions } from "@/lib/agent/nodes/humanReview";

import type { ChatEntry } from "../hooks/use-chat";
import { ChatInput } from "./chat-input";
import { ConfirmCard } from "./confirm-card";

/** Examples from the Rookpilot doc, shown before the first message. */
const SUGGESTIONS = ["I changed the air filter", "The garage door is grinding when it opens", "What's due this week?"];

interface ChatPanelProps {
  entries: ChatEntry[];
  onSend: (text: string) => void;
  onAnswer: (cardId: string, answers: Decisions) => void;
  onNewChat: () => void;
  /** Waiting on Rookpilot. */
  thinking: boolean;
  /** A confirm card needs an answer before the next message. */
  waitingCard: boolean;
  onClose: () => void;
  /** Taking up the whole page, with the conversation centered. */
  expanded?: boolean;
  /** Shows the expand / collapse button. Left out on phones, where chat is already full screen. */
  onToggleExpanded?: () => void;
}

/** The chat column: header, messages that scroll, and the input pinned to the bottom. */
export function ChatPanel({ entries, onSend, onAnswer, onNewChat, thinking, waitingCard, onClose, expanded = false, onToggleExpanded }: ChatPanelProps) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, thinking]);

  return (
    <section aria-label="Chat with Rookpilot" className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-background">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Rookpilot</h2>
          <p className="text-xs text-muted-foreground">Assistant</p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground"
            aria-label="New chat"
            title="New chat"
            onClick={onNewChat}
            disabled={thinking}
          >
            <SquarePen />
          </Button>
        )}
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
          {entries.length === 0 ? (
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
            entries.map((entry) =>
              entry.role === "card" ? (
                <ConfirmCard
                  key={`${entry.id}:${entry.attempt ?? 0}`}
                  changes={entry.changes}
                  answers={entry.answers}
                  onAnswer={(answers) => onAnswer(entry.id, answers)}
                  disabled={thinking}
                />
              ) : (
                <p
                  key={entry.id}
                  className={cn(
                    "max-w-[85%] animate-in rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap duration-300 fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none",
                    entry.role === "user"
                      ? "self-end rounded-br-md bg-foreground text-background"
                      : entry.error
                        ? "self-start rounded-bl-md bg-destructive/10 text-destructive"
                        : "self-start rounded-bl-md bg-muted text-foreground",
                  )}
                >
                  {entry.text}
                </p>
              ),
            )
          )}
          {thinking && (
            <p role="status" className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-3" aria-label="Rookpilot is thinking">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </p>
          )}
          <div ref={end} />
        </div>
      </div>

      <div className={cn("p-3 pt-0", expanded && "mx-auto w-full max-w-3xl pb-6")}>
        <ChatInput onSend={onSend} disabled={thinking || waitingCard} placeholder={waitingCard ? "Answer the card above first…" : undefined} />
      </div>
    </section>
  );
}
