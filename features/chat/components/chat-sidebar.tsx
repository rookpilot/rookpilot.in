"use client";

import { ChevronLeft, SquarePen } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

import type { ChatSummary } from "../chat-groups";
import { ChatHistory } from "./chat-history";

interface ChatSidebarProps {
  chats: ChatSummary[] | null;
  currentId: string | null;
  onOpen: (id: string) => void;
  onNewChat: () => void;
  /** Shrinks the chat back to the side and brings the app back. */
  onBack: () => void;
}

/** Takes the place of the app's sidebar while the chat is full screen. */
export function ChatSidebar({ chats, currentId, onOpen, onNewChat, onBack }: ChatSidebarProps) {
  return (
    <nav aria-label="Chats" className="flex h-full flex-col gap-3 px-3 py-4">
      <div className="flex h-8 items-center pl-1.5">
        <Logo href="/app" className="h-6" />
      </div>
      <Button variant="ghost" className="justify-start text-muted-foreground" onClick={onBack}>
        <ChevronLeft data-icon="inline-start" />
        Back to app
      </Button>
      <Button variant="outline" className="justify-start" onClick={onNewChat}>
        <SquarePen data-icon="inline-start" />
        New chat
      </Button>
      <ChatHistory chats={chats} currentId={currentId} onOpen={onOpen} className="flex-1" />
    </nav>
  );
}
