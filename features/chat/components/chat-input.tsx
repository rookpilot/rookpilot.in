"use client";

import { ArrowUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

/** Enter sends; Shift+Enter adds a new line. */
export function ChatInput({ onSend, placeholder = "Message Rookpilot…" }: ChatInputProps) {
  const [value, setValue] = useState("");

  function submit() {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-3xl border bg-card py-1.5 pr-1.5 pl-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message Rookpilot
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground"
      />
      <Button type="submit" size="icon" className="rounded-full" aria-label="Send" disabled={!value.trim()}>
        <ArrowUp />
      </Button>
    </form>
  );
}
