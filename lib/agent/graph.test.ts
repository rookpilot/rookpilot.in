import { Command } from "@langchain/langgraph";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests never call Claude or Supabase: callClaude is replaced with a fake, and the tools get a
// made-up building (tools/fakeContext.ts), so these check the wiring.
vi.mock("./llm", () => ({ callClaude: vi.fn() }));
vi.mock("./tools/context", () => ({ loadToolContext: vi.fn() }));

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
function setup(confirmLevel?: number) {
  const graph = buildAgentGraph();
  const config = { configurable: { thread_id: crypto.randomUUID() }, context: { buildingId: "b1", confirmLevel, today: "2026-11-20" } };
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

  it("tells Claude today's date and the person's confirm level", async () => {
    claudeSays("Hi!");
    await setup(70).send("hello");

    expect(vi.mocked(callClaude).mock.calls[0][0].system).toContain("Today is 2026-11-20. The person's confirm level: 70/100.");
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

  it("makes a change right away when Claude doesn't ask first", async () => {
    const run = vi.spyOn(findTool("create_work")!, "run");
    claudeCalls({ name: "create_work", input: { ...firePit, ask_first: false } });
    claudeSays("Added Fire pit.");
    const { send, pending } = setup(10);
    const out = await send("create me a fire pit project");

    expect(await pending()).toBeUndefined();
    expect(run).toHaveBeenCalledWith(firePit, expect.anything());
    expect(lastReply(out.messages)).toBe("Added Fire pit.");
  });

  it("shows the card when Claude asks first, and runs the change once confirmed", async () => {
    claudeCalls({ name: "create_work", input: { ...firePit, ask_first: true } });
    const { send, resume, pending } = setup(90);
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
    claudeCalls({ name: "create_work", input: { ...firePit, ask_first: true } });
    const { send, resume } = setup();
    await send("create me a fire pit project");

    claudeSays("Added Backyard fire pit.");
    await resume({ toolu_0: { action: "edit", input: { title: "Backyard fire pit" } } });

    expect(run).toHaveBeenCalledWith({ ...firePit, title: "Backyard fire pit" }, expect.anything());
  });

  it("always shows the card before a delete, even at the lowest level", async () => {
    claudeCalls({ name: "delete_work", input: { id: "deck" } });
    const { send, pending } = setup(0);
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
      { name: "create_work", input: { ...firePit, ask_first: false } },
      { name: "delete_work", input: { id: "deck" } },
    );
    const { send, resume, pending } = setup();
    await send("list my projects, add a fire pit, and delete the old deck");

    expect((await pending())?.map((change) => change.tool)).toEqual(["delete_work"]);

    claudeSays("Done.");
    const out = await resume({ toolu_2: { action: "confirm" } });
    expect(toolResults(out.messages).map((r) => r.tool_use_id)).toEqual(["toolu_0", "toolu_1", "toolu_2"]);
  });

  it("loads the building once per round of tool calls, and later calls see earlier changes", async () => {
    claudeCalls(
      { name: "create_room", input: { name: "Garage", ask_first: false } },
      { name: "list_rooms", input: {} },
    );
    claudeSays("Added the garage.");
    const out = await setup().send("add a garage");

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

  it("makes Claude decide ask_first on every write, and only on writes", () => {
    for (const tool of TOOLS) {
      const required = (tool.definition.input_schema.required ?? []) as string[];
      expect(required.includes("ask_first"), tool.name).toBe(tool.kind === "write");
    }
  });
});
