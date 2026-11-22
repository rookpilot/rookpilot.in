import { beforeEach, describe, expect, it, vi } from "vitest";

// Like graph.test.ts: a fake Claude and a made-up building, plus a fake Supabase client
// that only answers the sign-in and building checks.
vi.mock("./llm", () => ({ callClaude: vi.fn() }));
vi.mock("./tools/context", () => ({ loadToolContext: vi.fn() }));

import { streamAnswer, streamMessage, type ChatEvent } from "./chat";
import { callClaude } from "./llm";
import type { PendingChange } from "./nodes/humanReview";
import { loadToolContext } from "./tools/context";
import { fakeToolContext } from "./tools/fakeContext";

type Reply = Awaited<ReturnType<typeof callClaude>>;

function claudeSays(text: string) {
  vi.mocked(callClaude).mockResolvedValueOnce({ stop_reason: "end_turn", content: [{ type: "text", text, citations: null }] } as unknown as Reply);
}
function claudeCalls(name: string, input: Record<string, unknown>, id = "toolu_0") {
  vi.mocked(callClaude).mockResolvedValueOnce({ stop_reason: "tool_use", content: [{ type: "tool_use", id, name, input }] } as unknown as Reply);
}

type Client = Parameters<typeof streamMessage>[0];

async function collect(events: AsyncGenerator<ChatEvent>) {
  const all: ChatEvent[] = [];
  for await (const event of events) all.push(event);
  return all;
}

/** Runs the stream and returns where it stopped (the turn), like the chat shows it. */
async function sendMessage(supabase: Client, input: unknown) {
  const events = await collect(streamMessage(supabase, input));
  const last = events.at(-1);
  if (last?.type !== "turn") throw new Error("The stream didn't end with a turn");
  return last.turn;
}
async function answerCard(supabase: Client, input: unknown) {
  const events = await collect(streamAnswer(supabase, input));
  const last = events.at(-1);
  if (last?.type !== "turn") throw new Error("The stream didn't end with a turn");
  return last.turn;
}

/** A Supabase client for `userId` (or signed out), who can see the building or not. */
function fakeSupabase({ userId = "user-1" as string | null, seesBuilding = true } = {}) {
  return {
    auth: { getClaims: async () => ({ data: userId ? { claims: { sub: userId } } : null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: seesBuilding ? { id: "x" } : null }) }) }) }),
  } as unknown as Client;
}

// Shaped like the seed data's ids, which strict uuid checks reject.
const buildingId = "11111111-1111-1111-1111-111111111111";
const conversation = () => ({ threadId: crypto.randomUUID(), buildingId, today: "2026-11-20" });
const firePit = { kind: "project", title: "Fire pit", guessed: true };

describe("chat", () => {
  beforeEach(() => {
    vi.mocked(callClaude).mockReset();
    vi.mocked(loadToolContext).mockImplementation(async () => fakeToolContext());
  });

  it("returns Claude's reply", async () => {
    claudeSays("Every 1 to 3 months.");
    const turn = await sendMessage(fakeSupabase(), { ...conversation(), text: "how often should I change my furnace filter?" });
    expect(turn).toEqual({ kind: "reply", text: "Every 1 to 3 months." });
  });

  it("returns the card, then the reply once the person answers it", async () => {
    const supabase = fakeSupabase();
    const chat = conversation();
    claudeCalls("create_work", firePit);
    const card = await sendMessage(supabase, { ...chat, text: "add a fire pit project" });

    expect(card).toEqual({
      kind: "confirm",
      changes: [{ toolCallId: "toolu_0", tool: "create_work", kind: "write", input: { kind: "project", title: "Fire pit" } }] satisfies PendingChange[],
    });

    claudeSays("Added Fire pit.");
    const reply = await answerCard(supabase, { ...chat, decisions: { toolu_0: { action: "confirm" } } });
    expect(reply).toEqual({ kind: "reply", text: "Added Fire pit." });
  });

  it("keeps a new message waiting until the card is answered", async () => {
    const supabase = fakeSupabase();
    const chat = conversation();
    claudeCalls("create_work", firePit);
    await sendMessage(supabase, { ...chat, text: "add a fire pit project" });

    expect(await sendMessage(supabase, { ...chat, text: "actually, wait" })).toEqual({ kind: "error", message: "Answer the confirm card first." });
    expect(await answerCard(supabase, { ...chat, decisions: {} })).toEqual({ kind: "error", message: "Answer every change on the card." });
  });

  it("refuses an answer when there's no card", async () => {
    const turn = await answerCard(fakeSupabase(), { ...conversation(), decisions: { toolu_0: { action: "confirm" } } });
    expect(turn).toEqual({ kind: "error", message: "There's nothing waiting for an answer." });
  });

  it("refuses people who are signed out, or can't see the building, without calling Claude", async () => {
    const chat = { ...conversation(), text: "hi" };
    expect(await sendMessage(fakeSupabase({ userId: null }), chat)).toMatchObject({ kind: "error", message: expect.stringContaining("signed out") });
    expect(await sendMessage(fakeSupabase({ seesBuilding: false }), chat)).toEqual({ kind: "error", message: "That building wasn't found." });
    expect(callClaude).not.toHaveBeenCalled();
  });

  it("refuses bad input", async () => {
    expect(await sendMessage(fakeSupabase(), { ...conversation(), text: "   " })).toMatchObject({ kind: "error" });
    expect(await sendMessage(fakeSupabase(), { ...conversation(), threadId: "not-a-uuid", text: "hi" })).toMatchObject({ kind: "error" });
    expect(await answerCard(fakeSupabase(), { ...conversation(), decisions: { toolu_0: { action: "delete everything" } } } as never)).toMatchObject({ kind: "error" });
    expect(callClaude).not.toHaveBeenCalled();
  });

  it("keeps each person's conversations apart, even with the same thread id", async () => {
    const chat = conversation();
    claudeCalls("create_work", firePit);
    await sendMessage(fakeSupabase({ userId: "user-1" }), { ...chat, text: "add a fire pit project" });

    claudeSays("Hi!");
    expect(await sendMessage(fakeSupabase({ userId: "user-2" }), { ...chat, text: "hi" })).toEqual({ kind: "reply", text: "Hi!" });
    expect(await answerCard(fakeSupabase({ userId: "user-2" }), { ...chat, decisions: { toolu_0: { action: "confirm" } } })).toMatchObject({ kind: "error" });
  });

  it("returns a friendly error when the run fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(callClaude).mockRejectedValueOnce(new Error("overloaded"));
    const turn = await sendMessage(fakeSupabase(), { ...conversation(), text: "hi" });
    expect(turn).toEqual({ kind: "error", message: "Something went wrong. Try again in a moment." });
  });

  it("sends a step for each tool as it starts and finishes, then the reply", async () => {
    claudeCalls("list_work", { kind: "repair" });
    claudeSays("You have one repair.");
    const events = await collect(streamMessage(fakeSupabase(), { ...conversation(), text: "what repairs do I have?" }));

    expect(events).toEqual([
      { type: "step", id: "toolu_0", tool: "list_work", input: { kind: "repair" } },
      { type: "step_done", id: "toolu_0", ok: true },
      { type: "turn", turn: { kind: "reply", text: "You have one repair." } },
    ]);
  });

  it("leaves a carded change unfinished, then runs it once the person answers", async () => {
    const supabase = fakeSupabase();
    const chat = conversation();
    claudeCalls("create_work", firePit);
    const first = await collect(streamMessage(supabase, { ...chat, text: "add a fire pit project" }));
    expect(first.map((e) => e.type)).toEqual(["step", "turn"]);

    claudeSays("Added Backyard fire pit.");
    const second = await collect(streamAnswer(supabase, { ...chat, decisions: { toolu_0: { action: "edit", input: { title: "Backyard fire pit" } } } }));
    expect(second).toEqual([
      { type: "step", id: "toolu_0", tool: "create_work", input: { kind: "project", title: "Backyard fire pit" } },
      { type: "step_done", id: "toolu_0", ok: true },
      { type: "turn", turn: { kind: "reply", text: "Added Backyard fire pit." } },
    ]);
  });

  it("doesn't show a step for a cancelled change", async () => {
    const supabase = fakeSupabase();
    const chat = conversation();
    claudeCalls("delete_work", { id: "deck" });
    await collect(streamMessage(supabase, { ...chat, text: "delete the old deck" }));

    claudeSays("Okay, I left it.");
    const events = await collect(streamAnswer(supabase, { ...chat, decisions: { toolu_0: { action: "cancel" } } }));
    expect(events.filter((e) => e.type === "step")).toEqual([]);
  });

  it("marks a step that failed", async () => {
    // A quick action, so it runs without a card at the default level and fails on the other building's id.
    claudeCalls("complete_schedule", { id: "other-schedule", guessed: false });
    claudeSays("I couldn't find that one.");
    const events = await collect(streamMessage(fakeSupabase(), { ...conversation(), text: "I cleaned their coils" }));
    expect(events).toContainEqual({ type: "step_done", id: "toolu_0", ok: false });
  });
});
