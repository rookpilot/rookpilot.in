import Anthropic from "@anthropic-ai/sdk";
import { wrapAnthropic } from "langsmith/wrappers/anthropic";

// The one place the agent talks to Claude.
// Server-only: it reads ANTHROPIC_API_KEY, which must never reach the browser.

export const MODEL = "claude-opus-5-5";

export type Message = Anthropic.Beta.BetaMessageParam;
export type Tool = Anthropic.Beta.BetaTool;

let client: Anthropic | null = null;

/**
 * Created on first use, so importing the graph (tests, the diagram) doesn't need a key.
 * wrapAnthropic records each call in LangSmith when LANGSMITH_TRACING=true, nested under the
 * graph run. With tracing off it passes calls straight through.
 */
function getClient(): Anthropic {
  client ??= wrapAnthropic(new Anthropic());
  return client;
}

/**
 * Sends the conversation so far and returns Claude's next message.
 * - effort "low": chat turns are short, so Claude thinks less and answers faster and cheaper.
 * - fallbacks "default": if Claude declines a request, the API retries it on a fallback model
 *   in the same call. If every model declines, stop_reason is "refusal".
 */
export async function callClaude({
  system,
  messages,
  tools = [],
}: {
  system: string;
  messages: Message[];
  tools?: Tool[];
}): Promise<Anthropic.Beta.BetaMessage> {
  return getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01", "thinking-binding-controls-2026-08-01"],
    fallbacks: "default",
    // Claude's thinking is tied to the exact prompt and tools it was made with. If those change
    // (a new version of the prompt, a new tool), a saved chat would fail, so drop the old thinking
    // instead. Claude still sees every message and tool call.
    thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
    output_config: { effort: "low" },
    system,
    messages,
    ...(tools.length > 0 && { tools }),
  });
}
