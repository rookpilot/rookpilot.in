import { describe, expect, it } from "vitest";

import type { Message } from "./llm";
import type { PendingChange } from "./nodes/humanReview";
import { toTranscript } from "./transcript";

const toolUse = (id: string, name: string, input: Record<string, unknown>) => ({ type: "tool_use" as const, id, name, input });
const toolResult = (id: string, content: string, is_error?: boolean) => ({ type: "tool_result" as const, tool_use_id: id, content, ...(is_error && { is_error }) });

describe("toTranscript", () => {
  it("shows messages, the tools used, and the final reply", () => {
    const messages: Message[] = [
      { role: "user", content: "add a fire pit project" },
      { role: "assistant", content: [{ type: "text", text: "Let me check." }, toolUse("t1", "list_rooms", {})] },
      { role: "user", content: [toolResult("t1", "[]")] },
      { role: "assistant", content: [toolUse("t2", "create_work", { title: "Fire pit", kind: "project", guessed: false })] },
      { role: "user", content: [toolResult("t2", "{}")] },
      { role: "assistant", content: [{ type: "text", text: "Done! Added it." }] },
    ];
    expect(toTranscript(messages)).toEqual([
      { id: "m0", role: "user", text: "add a fire pit project" },
      {
        id: "m5",
        role: "assistant",
        text: "Done! Added it.",
        steps: [
          { id: "t1", tool: "list_rooms", input: {}, status: "done" },
          { id: "t2", tool: "create_work", input: { title: "Fire pit", kind: "project" }, status: "done" },
        ],
      },
    ]);
  });

  it("marks failed tools and leaves out cancelled ones", () => {
    const messages: Message[] = [
      { role: "user", content: "delete the furnace and add a deck" },
      { role: "assistant", content: [toolUse("t1", "delete_item", { id: "x" }), toolUse("t2", "create_work", { title: "Deck" })] },
      { role: "user", content: [toolResult("t1", "The person cancelled this change. Nothing was changed."), toolResult("t2", "Save failed", true)] },
      { role: "assistant", content: [{ type: "text", text: "Couldn't add the deck." }] },
    ];
    expect(toTranscript(messages).at(-1)).toEqual({
      id: "m3",
      role: "assistant",
      text: "Couldn't add the deck.",
      steps: [{ id: "t2", tool: "create_work", input: { title: "Deck" }, status: "failed" }],
    });
  });

  it("ends with the card when one is still waiting", () => {
    const pending: PendingChange[] = [{ toolCallId: "t2", tool: "create_work", kind: "write", input: { title: "Fire pit" } }];
    const messages: Message[] = [
      { role: "user", content: "add a fire pit" },
      { role: "assistant", content: [toolUse("t1", "list_rooms", {})] },
      { role: "user", content: [toolResult("t1", "[]")] },
      { role: "assistant", content: [toolUse("t2", "create_work", { title: "Fire pit" })] },
    ];
    expect(toTranscript(messages, pending)).toEqual([
      { id: "m0", role: "user", text: "add a fire pit" },
      { id: "pending", role: "card", changes: pending, steps: [{ id: "t1", tool: "list_rooms", input: {}, status: "done" }] },
    ]);
  });

  it("is empty for a chat with nothing saved", () => {
    expect(toTranscript([])).toEqual([]);
  });
});
