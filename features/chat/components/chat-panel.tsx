"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { useStubChat } from "../hooks/use-stub-chat";
import { ChatInput } from "./chat-input";

/** Examples from the Rookpilot doc, shown before the first message. */
const SUGGESTIONS = ["I changed the air filter", "The garage door is grinding when it opens", "What's due this week?"];

export function ChatPanel() {
  const { messages, send } = useStubChat();

  return (
    <section aria-label="Chat with Rookpilot" className="flex flex-col gap-3">
      <div className="flex min-h-48 flex-col justify-end gap-3 rounded-lg border border-dashed bg-card p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Tell Rookpilot what happened, or ask what&apos;s next.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border bg-card px-3 py-1 text-[13px] hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                "max-w-[78%] rounded-xl px-3 py-2 text-sm",
                m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted text-muted-foreground italic",
              )}
            >
              {m.text}
            </p>
          ))
        )}
      </div>
      <ChatInput onSend={send} />
    </section>
  );
}
