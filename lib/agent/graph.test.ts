import { Command } from "@langchain/langgraph";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests never call Claude or Supabase: callClaude is replaced with a fake, and the tools get a
// made-up building (tools/fakeContext.ts), so these check the wiring.
vi.mock("./llm", () => ({ callClaude: vi.fn() }));
vi.mock("./tools/context", () => ({ loadToolContext: vi.fn() }));

import type { ConfirmMode } from "./confirm";
import { buildAgentGraph } from "./graph";
import { callClaude, type Message } from "./llm";
import type { PendingChange } from "./nodes/humanReview";
import { lastReply } from "./state";
import { findTool, TOOLS } from "./tools";
import { loadToolContext } from "./tools/context";
import { fakeToolContext } from "./tools/fakeContext";

type Reply = Awaited<ReturnType<typeof callClaude>>;

/** Queues the fake Claude's next answer: some text, or tool calls. */
function claudeSays(text: string) {
  vi.mocked(callClaude).mockResolvedValueOnce({
    stop_reason: "end_turn",
    content: [{ type: "text", text, citations: null }],
  } as unknown as Reply);
}
function claudeCalls(...calls: { name: string; input: Record<string, unknown> }[]) {
  vi.mocked(callClaude).mockResolvedValueOnce({
    stop_reason: "tool_use",
    content: calls.map((call, i) => ({ type: "tool_use", id: `toolu_${i}`, ...call })),
  } as unknown as Reply);
}

/** A fresh graph and conversation for each test. */
function setup(confirmMode?: ConfirmMode) {
  const graph = buildAgentGraph();
  const config = { configurable: { thread_id: crypto.randomUUID() }, context: { buildingId: "b1", confirmMode, today: "2026-11-20" } };
  const send = (content: string) => graph.invoke({ messages: [{ role: "user", content }] }, config);
  const resume = (decisions: Record<string, unknown>) => graph.invoke(new Command({ resume: decisions }), config);
  const pending = async () => {
    const state = await graph.getState(config);
    return state.tasks.flatMap((task) => task.interrupts).at(0)?.value as PendingChange[] | undefined;
  };
  return { send, resume, pending };
}

/** The tool_result blocks in the conversation, in order. */
function toolResults(messages: Message[]) {
  return messages.flatMap((m) =>
    m.role === "user" && Array.isArray(m.content) ? m.content.filter((b) => b.type === "tool_result") : [],
  );
}

const firePit = { kind: "project", title: "Fire pit", status: "idea" };

describe("agent graph", () => {
  beforeEach(() => vi.restoreAllMocks());
  beforeEach(() => vi.mocked(callClaude).mockReset());
  beforeEach(() => vi.mocked(loadToolContext).mockImplementation(async () => fakeToolContext()));

  it("replies straight away when Claude doesn't need a tool", async () => {
    claudeSays("Every 1 to 3 months.");
    const out = await setup().send("how often should I change my furnace filter?");

    expect(out.messages).toHaveLength(2);
    expect(lastReply(out.messages)).toBe("Every 1 to 3 months.");
  });

  it("keeps the date and the person's level out of the prompt, so it never changes", async () => {
    claudeSays("Hi!");
    await setup("always").send("hello");

    const { system } = vi.mocked(callClaude).mock.calls[0][0];
    expect(system).not.toContain("Today is");
    expect(system).not.toContain("always");
  });

  it("runs reads without asking, then goes back to the agent", async () => {
    claudeCalls({ name: "list_work", input: { kind: "project" } });
    claudeSays("You have one project: Old deck.");
    const { send, pending } = setup();
    const out = await send("what projects do I have?");

    expect(await pending()).toBeUndefined();
    const [result] = toolResults(out.messages);
    expect(result.tool_use_id).toBe("toolu_0");
    expect(JSON.parse(result.content as string)).toMatchObject([{ id: "deck", title: "Old deck" }]);
    expect(lastReply(out.messages)).toBe("You have one project: Old deck.");
  });

  it("adds a new record right away at rarely, when nothing was guessed", async () => {
    const run = vi.spyOn(findTool("create_work")!, "run");
    claudeCalls({ name: "create_work", input: { ...firePit, guessed: false } });
    claudeSays("Added Fire pit.");
    const { send, pending } = setup("rarely");
    const out = await send("create me a fire pit project");

    expect(await pending()).toBeUndefined();
    expect(run).toHaveBeenCalledWith(firePit, expect.anything());
    expect(lastReply(out.messages)).toBe("Added Fire pit.");
  });

  it("shows the card for a new record at sometimes, even when nothing was guessed", async () => {
    claudeCalls({ name: "create_work", input: { kind: "repair", title: "Fix garbage disposal", room_id: "kitchen", guessed: false } });
    const { send, pending } = setup();
    await send("make a repair for fixing my garbage disposal in the kitchen");

    expect((await pending())?.map((change) => change.tool)).toEqual(["create_work"]);
  });

  it("lets quick actions through at sometimes, but shows them at always", async () => {
    for (const [mode, card] of [["sometimes", false], ["always", true]] as const) {
      claudeCalls({ name: "complete_schedule", input: { id: "filter", guessed: false } });
      claudeCalls({ name: "update_schedule", input: { id: "filter", next_due_on: "2027-01-15", guessed: false } });
      claudeSays("Done.");
      claudeSays("Done.");
      const { send, pending } = setup(mode);
      await send("I changed the filter");
      expect(Boolean(await pending()), `complete at ${mode}`).toBe(card);
      if (card) continue;
      await send("snooze it to mid January");
      expect(await pending(), `snooze at ${mode}`).toBeUndefined();
    }
  });

  it("treats changing what a schedule is as an edit, not a quick action", async () => {
    claudeCalls({ name: "update_schedule", input: { id: "filter", title: "Replace HEPA filter", guessed: false } });
    const { send, pending } = setup();
    await send("call it the HEPA filter");
    expect((await pending())?.map((change) => change.tool)).toEqual(["update_schedule"]);
  });

  it("shows the card when Claude guessed something, even at rarely, and runs it once confirmed", async () => {
    claudeCalls({ name: "create_work", input: { ...firePit, guessed: true } });
    const { send, resume, pending } = setup("rarely");
    await send("create me a fire pit project");

    expect(await pending()).toEqual([{ toolCallId: "toolu_0", tool: "create_work", kind: "write", input: firePit }]);
    expect(callClaude).toHaveBeenCalledTimes(1);

    claudeSays("Added Fire pit.");
    const out = await resume({ toolu_0: { action: "confirm" } });

    expect(JSON.parse(toolResults(out.messages)[0].content as string)).toMatchObject({ title: "Fire pit", status: "idea" });
    expect(lastReply(out.messages)).toBe("Added Fire pit.");
  });

  it("runs an edited change with the person's fields", async () => {
    const run = vi.spyOn(findTool("create_work")!, "run");
    claudeCalls({ name: "create_work", input: { ...firePit, guessed: true } });
    const { send, resume } = setup();
    await send("create me a fire pit project");

    claudeSays("Added Backyard fire pit.");
    await resume({ toolu_0: { action: "edit", input: { title: "Backyard fire pit" } } });

    expect(run).toHaveBeenCalledWith({ ...firePit, title: "Backyard fire pit" }, expect.anything());
  });

  it("always shows the card before a delete, even at the lowest level", async () => {
    claudeCalls({ name: "delete_work", input: { id: "deck" } });
    const { send, pending } = setup("rarely");
    await send("delete the old deck");

    expect((await pending())?.map((change) => change.tool)).toEqual(["delete_work"]);
  });

  it("says on the card what else a delete takes with it", async () => {
    claudeCalls({ name: "delete_item", input: { id: "furnace" } });
    const { send, pending } = setup();
    await send("delete the furnace");

    expect(await pending()).toEqual([
      {
        toolCallId: "toolu_0",
        tool: "delete_item",
        kind: "delete",
        input: { id: "furnace" },
        effects: "Also deletes 1 schedule, 1 history entry. 1 project or repair stays, unlinked.",
      },
    ]);
  });

  it("tells Claude when the person cancels, without running the tool", async () => {
    const run = vi.spyOn(findTool("delete_work")!, "run");
    claudeCalls({ name: "delete_work", input: { id: "deck" } });
    const { send, resume } = setup();
    await send("delete the old deck");

    claudeSays("Okay, I left it.");
    const out = await resume({ toolu_0: { action: "cancel", reason: "wrong one" } });

    expect(run).not.toHaveBeenCalled();
    expect(toolResults(out.messages)[0].content).toBe("The person cancelled this change: wrong one Nothing was changed.");
  });

  it("only puts the changes that need it on the card", async () => {
    claudeCalls(
      { name: "list_work", input: {} },
      { name: "create_work", input: { ...firePit, guessed: false } },
      { name: "delete_work", input: { id: "deck" } },
    );
    const { send, resume, pending } = setup("rarely");
    await send("list my projects, add a fire pit, and delete the old deck");

    expect((await pending())?.map((change) => change.tool)).toEqual(["delete_work"]);

    claudeSays("Done.");
    const out = await resume({ toolu_2: { action: "confirm" } });
    expect(toolResults(out.messages).map((r) => r.tool_use_id)).toEqual(["toolu_0", "toolu_1", "toolu_2"]);
  });

  it("loads the building once per round of tool calls, and later calls see earlier changes", async () => {
    claudeCalls(
      { name: "create_room", input: { name: "Garage", guessed: false } },
      { name: "list_rooms", input: {} },
    );
    claudeSays("Added the garage.");
    const out = await setup("rarely").send("add a garage");

    expect(loadToolContext).toHaveBeenCalledTimes(1);
    expect(JSON.parse(toolResults(out.messages)[1].content as string)).toHaveLength(3);
  });

  it("sends bad input back to Claude as an error instead of running the tool", async () => {
    claudeCalls({ name: "list_work", input: { status: "not-a-status" } });
    claudeSays("Let me try that again.");
    const out = await setup().send("show me my stuff");

    expect(toolResults(out.messages)[0]).toMatchObject({ tool_use_id: "toolu_0", is_error: true });
  });
});

describe("tools", () => {
  it("has one tool per action, with unique names", () => {
    expect(TOOLS).toHaveLength(22);
    expect(new Set(TOOLS.map((tool) => tool.name)).size).toBe(22);
    const count = (kind: string) => TOOLS.filter((tool) => tool.kind === kind).length;
    expect({ read: count("read"), write: count("write"), delete: count("delete") }).toEqual({ read: 6, write: 11, delete: 5 });
  });

  it("sends Claude an object schema for every tool", () => {
    for (const tool of TOOLS) expect(tool.definition.input_schema.type, tool.name).toBe("object");
  });

  it("says what type of change each write and delete is", () => {
    const types = Object.fromEntries(TOOLS.filter((tool) => tool.kind !== "read").map((tool) => [tool.name, tool.change({ id: "x" })]));
    expect(types).toEqual({
      ...{ create_work: "new", update_work: "edit", delete_work: "delete" },
      ...{ create_schedule: "new", update_schedule: "quick", complete_schedule: "quick", delete_schedule: "delete" },
      ...{ create_contact: "new", update_contact: "edit", delete_contact: "delete" },
      ...{ create_room: "new", update_room: "edit", delete_room: "delete" },
      ...{ create_item: "new", update_item: "edit", delete_item: "delete" },
    });
  });

  it("asks Claude whether it guessed on every write, and only on writes", () => {
    for (const tool of TOOLS) {
      const required = (tool.definition.input_schema.required ?? []) as string[];
      expect(required.includes("guessed"), tool.name).toBe(tool.kind === "write");
    }
  });
});
