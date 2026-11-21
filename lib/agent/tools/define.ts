import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod";
import type { DataAction } from "@/lib/data/reducer";
import type { AppData } from "@/lib/data/types";
import type { Building, ISODate } from "@/lib/domain/models";
import type { ToolKind } from "../confirm";
import type { Tool } from "../llm";

// Every agent tool is made with defineTool(), so they all have the same shape.

/** What a tool gets besides its input. Filled in by the graph, never chosen by Claude (see context.ts). */
export type ToolContext = {
  /** The person's current building. Tools only read and change records in this one. */
  building: Building;
  today: ISODate;
  /** Everything the person can see. Kept up to date as the tools save changes. */
  data: AppData;
  /** Saves one change with the app's own save code, the same way the app's buttons do. */
  save: (action: DataAction) => Promise<void>;
};

export type AgentTool = {
  name: string;
  /** read, write, or delete. Decides whether the change can need the confirm card. */
  kind: ToolKind;
  /** What gets sent to Claude: name, description, and the input's JSON schema. */
  definition: Tool;
  /** Checks Claude's input against the schema and drops ask_first. Throws if it doesn't match. */
  parse: (input: unknown) => unknown;
  run: (input: unknown, context: ToolContext) => Promise<unknown>;
  /** For deletes: what else goes with the record, shown on the confirm card. */
  effects?: (input: unknown, context: ToolContext) => string | undefined;
};

/**
 * Added to every write tool, so Claude decides on each change whether to show the confirm card
 * (see confirm.ts). Deletes always show it, so they don't get this field.
 */
const askFirst = z
  .boolean()
  .describe("true to show the person a confirm card before this runs, false to make the change right away. Follow the confirm level in your instructions.");

export function defineTool<Input extends z.ZodObject>(options: {
  name: string;
  kind: ToolKind;
  /** Claude reads this to decide when to call the tool, so say what it's for and when to use it. */
  description: string;
  input: Input;
  run: (input: z.infer<Input>, context: ToolContext) => Promise<unknown>;
  effects?: (input: z.infer<Input>, context: ToolContext) => string | undefined;
}): AgentTool {
  const { name, kind, description, input, run, effects } = options;
  const schema = kind === "write" ? input.extend({ ask_first: askFirst }) : input;

  // betaZodTool converts the zod schema to the JSON schema the API expects. We run tools
  // ourselves in the tools node, so only the schema is used.
  const converted = betaZodTool({ name, description, inputSchema: schema, run: () => "" });
  // Its return type covers every kind of tool, but a zod tool is always a custom one.
  const { input_schema } = converted as unknown as Tool;

  return {
    name,
    kind,
    definition: { name, description, input_schema },
    parse: (value) => {
      const parsed = schema.parse(value) as Record<string, unknown>;
      delete parsed.ask_first;
      return parsed;
    },
    run: (args, context) => run(args as z.infer<Input>, context),
    ...(effects && { effects: (args: unknown, context: ToolContext) => effects(args as z.infer<Input>, context) }),
  };
}

// Field types the tools share.

export const id = (what: string) => z.string().describe(`The ${what}'s id. Look it up with a list tool first.`);

export const date = (what: string) => z.iso.date().describe(`${what}, as YYYY-MM-DD.`);
