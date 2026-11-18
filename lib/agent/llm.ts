import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod";

// The one place the agent talks to Claude. Every node calls ask() or askFor() with its own system prompt.
// Server-only: it reads ANTHROPIC_API_KEY, which must never reach the browser.

export const MODEL = "claude-opus-5-5";

/**
 * Settings every call shares.
 * - effort "low": these are short, simple steps, so Claude thinks less and answers faster and cheaper.
 *   Raise it per node if one needs deeper reasoning.
 * - fallbacks "default": if Claude declines a request, the API retries it on a fallback model in the same call.
 */
const SHARED = {
  model: MODEL,
  max_tokens: 16000,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
} satisfies Partial<Anthropic.Beta.MessageCreateParamsNonStreaming>;

const DECLINED = "Sorry, I can't help with that one.";

let client: Anthropic | null = null;

/** Created on first use, so importing the graph (tests, the diagram) doesn't need a key. */
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** Sends one message with a system prompt and returns Claude's text reply. */
export async function ask(system: string, message: string): Promise<string> {
  const response = await getClient().beta.messages.create({
    ...SHARED,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: message }],
  });
  if (response.stop_reason === "refusal") return DECLINED;
  return response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
}

/** Like ask(), but Claude must answer in the shape of `schema`, and you get a typed object back. */
export async function askFor<T extends z.ZodType>(system: string, message: string, schema: T): Promise<z.infer<T>> {
  const response = await getClient().beta.messages.parse({
    ...SHARED,
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: message }],
  });
  if (response.stop_reason === "refusal") throw new Error(DECLINED);
  if (!response.parsed_output) throw new Error("Claude's answer didn't match the expected shape.");
  return response.parsed_output;
}
