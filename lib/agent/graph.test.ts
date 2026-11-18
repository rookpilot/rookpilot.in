import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests never call Claude: callClaude is replaced with a fake, so these check the wiring.
vi.mock("./llm", () => ({ callClaude: vi.fn() }));

import { agentGraph } from "./graph";
import { callClaude } from "./llm";
import { lastReply } from "./state";

/** Makes the fake Claude answer with this text (or decline). */
function fakeReply(text: string, stop_reason: "end_turn" | "refusal" = "end_turn") {
  vi.mocked(callClaude).mockResolvedValueOnce({
    stop_reason,
    content: [{ type: "text", text, citations: null }],
  } as unknown as Awaited<ReturnType<typeof callClaude>>);
}

describe("agent graph", () => {
  beforeEach(() => vi.resetAllMocks());

  it("adds Claude's reply after the person's message", async () => {
    fakeReply("Hi! How can I help with your home?");
    const out = await agentGraph.invoke({ messages: [{ role: "user", content: "hello" }] });

    expect(out.messages).toHaveLength(2);
    expect(out.messages[0]).toEqual({ role: "user", content: "hello" });
    expect(lastReply(out.messages)).toBe("Hi! How can I help with your home?");
  });

  it("sends the whole conversation to Claude", async () => {
    fakeReply("Every 3 months.");
    const history = [
      { role: "user" as const, content: "I have a furnace filter" },
      { role: "assistant" as const, content: "Got it." },
      { role: "user" as const, content: "how often should I change it?" },
    ];
    await agentGraph.invoke({ messages: history });

    expect(vi.mocked(callClaude).mock.calls[0][0].messages).toEqual(history);
  });

  it("replies with a short apology when Claude declines", async () => {
    fakeReply("", "refusal");
    const out = await agentGraph.invoke({ messages: [{ role: "user", content: "..." }] });

    expect(lastReply(out.messages)).toBe("Sorry, I can't help with that one.");
  });
});
