// When the agent shows the confirm card before changing something.
//
// Each person picks how much confirming they want: a level from 0 (rarely ask) to 100 (ask
// about every change). Claude reads the level and decides, change by change, whether to ask
// first. Deletes always ask, whatever the level, because they can't be undone.

import type { AgentContext } from "./context";

/** What a tool does to the records. */
export type ToolKind = "read" | "write" | "delete";

/** Used until the person picks their own level in settings. */
export const DEFAULT_CONFIRM_LEVEL = 50;

/** The person's level, kept within 0 to 100, or the default if they haven't set one. */
export function confirmLevel(context: Partial<AgentContext> | undefined): number {
  const level = context?.confirmLevel ?? DEFAULT_CONFIRM_LEVEL;
  return Math.min(100, Math.max(0, Math.round(level)));
}

/**
 * Whether a change needs the confirm card.
 * - reads never do
 * - deletes always do
 * - writes do when Claude asked to check with the person first
 */
export function needsConfirmation(kind: ToolKind, claudeAskedFirst: boolean): boolean {
  if (kind === "read") return false;
  if (kind === "delete") return true;
  return claudeAskedFirst;
}
