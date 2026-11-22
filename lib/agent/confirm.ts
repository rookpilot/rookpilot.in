// When the agent shows the confirm card before changing something.
//
// Each person picks how often Rookpilot checks with them: rarely, sometimes, or always. The
// level and the type of change decide whether a change gets a card. Claude only reports whether
// it guessed anything (the `guessed` field on every write tool), and a guess always gets a card.
//
// | Change                        | Rarely | Sometimes | Always |
// | ----------------------------- | ------ | --------- | ------ |
// | Delete                        | card   | card      | card   |
// | Claude guessed something      | card   | card      | card   |
// | New record                    |        | card      | card   |
// | Edit an existing record       |        | card      | card   |
// | Quick action (done, snooze…)  |        |           | card   |

import type { AgentContext } from "./context";

/** What a tool does to the records. */
export type ToolKind = "read" | "write" | "delete";

/** What one change does, which decides whether it gets a card at each level. */
export type ChangeType = "new" | "edit" | "quick" | "delete";

export const CONFIRM_MODES = ["rarely", "sometimes", "always"] as const;
export type ConfirmMode = (typeof CONFIRM_MODES)[number];

/** Used until the person picks their own level in settings. */
export const DEFAULT_CONFIRM_MODE: ConfirmMode = "sometimes";

/** Which changes get a card at each level, besides guesses. */
const CARDED: Record<ConfirmMode, readonly ChangeType[]> = {
  rarely: ["delete"],
  sometimes: ["delete", "new", "edit"],
  always: ["delete", "new", "edit", "quick"],
};

/** The person's level, or the default if they haven't picked one. */
export function confirmMode(context: Partial<AgentContext> | undefined): ConfirmMode {
  const mode = context?.confirmMode;
  return mode && CONFIRM_MODES.includes(mode) ? mode : DEFAULT_CONFIRM_MODE;
}

/** Whether a change needs the confirm card. */
export function needsConfirmation(mode: ConfirmMode, change: ChangeType, guessed: boolean): boolean {
  return guessed || CARDED[mode].includes(change);
}
