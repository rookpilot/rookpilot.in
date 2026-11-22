import { describe, expect, it } from "vitest";

import { fakeData } from "@/lib/agent/tools/fakeContext";

import { stepLabel, type Step } from "./steps";
import { readEvents } from "./stream";

const step = (tool: string, input: Record<string, unknown>, status: Step["status"] = "running"): Step => ({ id: "t", tool, input, status });

describe("stepLabel", () => {
  it("says what's happening, then what happened", () => {
    expect(stepLabel(step("list_work", { kind: "repair" }), fakeData())).toBe("Checking your repairs…");
    expect(stepLabel(step("list_work", { kind: "repair" }, "done"), fakeData())).toBe("Checked your repairs");
    expect(stepLabel(step("list_work", {}, "failed"), fakeData())).toBe("Couldn't check your projects and repairs");
  });

  it("uses names instead of ids", () => {
    const data = fakeData();
    expect(stepLabel(step("list_items", { room_id: "kitchen" }), data)).toBe("Looking at items in the Kitchen…");
    expect(stepLabel(step("create_work", { kind: "repair", title: "Fix disposal" }, "done"), data)).toBe('Added "Fix disposal"');
    expect(stepLabel(step("update_work", { id: "deck", status: "planning" }), data)).toBe('Updating "Old deck"…');
    expect(stepLabel(step("delete_item", { id: "furnace" }, "done"), data)).toBe('Deleted "Furnace"');
    expect(stepLabel(step("complete_schedule", { id: "filter" }), data)).toBe('Marking "Replace filter" done…');
    expect(stepLabel(step("delete_room", { id: "gone" }), data)).toBe("Deleting a room…");
  });
});

describe("readEvents", () => {
  it("reads events even when a chunk ends partway through a line", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"step","id":"a","tool":"list_work","input":{}}\n{"type":"step_'));
        controller.enqueue(encoder.encode('done","id":"a","ok":true}\n{"type":"turn","turn":{"kind":"reply","text":"Hi"}}'));
        controller.close();
      },
    });
    const events = [];
    for await (const event of readEvents(body)) events.push(event.type);
    expect(events).toEqual(["step", "step_done", "turn"]);
  });
});
