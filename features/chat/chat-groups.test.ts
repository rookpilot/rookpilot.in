import { describe, expect, it } from "vitest";

import { groupChats } from "./chat-groups";

const now = new Date(2026, 10, 22, 20, 0);
const at = (daysBack: number, hour = 9) => new Date(2026, 10, 22 - daysBack, hour).toISOString();

describe("groupChats", () => {
  it("groups chats by when they were last used, newest first", () => {
    const groups = groupChats(
      [
        { id: "old", title: "Gutters", updatedAt: at(30) },
        { id: "morning", title: "Filter", updatedAt: at(0, 8) },
        { id: "evening", title: "Fire pit", updatedAt: at(0, 19) },
        { id: "yesterday", title: "Faucet", updatedAt: at(1) },
        { id: "week", title: "Smoke alarm", updatedAt: at(6) },
      ],
      now,
    );
    expect(groups.map((group) => [group.label, group.chats.map((chat) => chat.id)])).toEqual([
      ["Today", ["evening", "morning"]],
      ["Yesterday", ["yesterday"]],
      ["Last 7 days", ["week"]],
      ["Older", ["old"]],
    ]);
  });

  it("leaves out empty groups", () => {
    expect(groupChats([{ id: "a", title: "A", updatedAt: at(10) }], now).map((group) => group.label)).toEqual(["Older"]);
    expect(groupChats([], now)).toEqual([]);
  });
});
