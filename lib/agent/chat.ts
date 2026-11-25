import type Anthropic from "@anthropic-ai/sdk";
import { Command } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as z from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type { ConfirmMode } from "./confirm";
import { today, type AgentContext } from "./context";
import { agentGraph } from "./graph";
import type { PendingChange } from "./nodes/humanReview";
import type { Message } from "./llm";
import { lastReply, pendingToolCalls, personMessage, type ToolCall } from "./state";
import { toTranscript, type TranscriptEntry } from "./transcript";

// What the chat calls (through the streaming route in app/api/chat/route.ts). Each call checks
// who's asking and what they sent, runs the graph, and sends events as it goes:
// - a step for each tool Claude uses, and when it's done, so the chat can show progress
// - then exactly one turn: a reply, changes waiting on the confirm card, or an error

export type ChatTurn =
  | { kind: "reply"; text: string }
  | { kind: "confirm"; changes: PendingChange[] }
  | { kind: "error"; message: string };

type Client = SupabaseClient<Database>;

const conversation = {
  /** Made by the browser when a chat starts. One per conversation. */
  threadId: z.guid(),
  // guid, not uuid: Postgres takes any uuid-shaped id, like the seed data's 11111111-1111-...
  buildingId: z.guid(),
  /** The person's date, so "today" matches theirs and not the server's. */
  today: z.iso.date().optional(),
};

const messageInput = z.object({ ...conversation, text: z.string().trim().min(1).max(4000) });

const decision = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("edit"), input: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal("cancel"), reason: z.string().max(500).optional() }),
]);
const answerInput = z.object({ ...conversation, decisions: z.record(z.string(), decision) });

const loadInput = z.object({ threadId: conversation.threadId, buildingId: conversation.buildingId });

export type MessageInput = z.input<typeof messageInput>;
export type AnswerInput = z.input<typeof answerInput>;
/** What the chat posts to the route. */
export type ChatRequest = { action: "message"; input: MessageInput } | { action: "answer"; input: AnswerInput };

export type ChatEvent =
  /** Claude asked to use a tool. */
  | { type: "step"; id: string; tool: string; input: Record<string, unknown> }
  /** That tool finished. `ok` is false when it failed. */
  | { type: "step_done"; id: string; ok: boolean }
  /** Where the run stopped. Always the last event. */
  | { type: "turn"; turn: ChatTurn };

const error = (message: string): ChatTurn => ({ kind: "error", message });
const FAILED = error("Something went wrong. Try again in a moment.");
const turn = (value: ChatTurn): ChatEvent => ({ type: "turn", turn: value });

function step(call: ToolCall, edits?: Record<string, unknown>): ChatEvent {
  const input: Record<string, unknown> = { ...(call.input as Record<string, unknown>), ...edits };
  delete input.guessed;
  return { type: "step", id: call.id, tool: call.name, input };
}

/** A saved chat, the way the chat shows it, or why it couldn't be opened. */
export type SavedChat = { kind: "chat"; entries: TranscriptEntry[] } | { kind: "error"; message: string };

/** Opens a saved chat: its messages, the tools Rookpilot used, and a card still waiting. */
export async function loadChat(supabase: Client, raw: unknown): Promise<SavedChat> {
  const input = loadInput.safeParse(raw);
  if (!input.success) return { kind: "error", message: "That chat couldn't be opened." };
  const config = await configFor(supabase, input.data);
  if ("kind" in config) return { kind: "error", message: config.kind === "error" ? config.message : "That chat couldn't be opened." };
  try {
    const state = await agentGraph.getState(config);
    return { kind: "chat", entries: toTranscript(state.values.messages ?? [], await pendingChanges(config)) };
  } catch (cause) {
    console.error("Opening a chat failed", cause);
    return { kind: "error", message: "That chat couldn't be opened. Try again in a moment." };
  }
}

/** Sends the person's message and runs the agent until it replies or needs the confirm card. */
export async function* streamMessage(supabase: Client, raw: unknown): AsyncGenerator<ChatEvent> {
  const input = messageInput.safeParse(raw);
  if (!input.success) return yield turn(error("That message couldn't be sent."));
  const config = await configFor(supabase, input.data);
  if ("kind" in config) return yield turn(config);
  if (await pendingChanges(config)) return yield turn(error("Answer the confirm card first."));
  await saveChat(supabase, input.data);

  yield* follow(config, { messages: [personMessage(input.data.text, today(config.context))] });
}

/** Answers the confirm card and runs the agent on from where it paused. */
export async function* streamAnswer(supabase: Client, raw: unknown): AsyncGenerator<ChatEvent> {
  const input = answerInput.safeParse(raw);
  if (!input.success) return yield turn(error("That answer couldn't be sent."));
  const config = await configFor(supabase, input.data);
  if ("kind" in config) return yield turn(config);
  const changes = await pendingChanges(config);
  if (!changes) return yield turn(error("There's nothing waiting for an answer."));
  const { decisions } = input.data;
  if (!changes.every((change) => decisions[change.toolCallId])) return yield turn(error("Answer every change on the card."));
  await saveChat(supabase, input.data);

  // Every tool call Claude made in that round runs now, except the cancelled ones.
  const { values } = await agentGraph.getState(config);
  for (const call of pendingToolCalls(values.messages)) {
    const decision = decisions[call.id];
    if (decision?.action !== "cancel") yield step(call, decision?.action === "edit" ? decision.input : undefined);
  }
  yield* follow(config, new Command({ resume: decisions }));
}

type Conversation = z.infer<typeof messageInput> | z.infer<typeof answerInput> | z.infer<typeof loadInput>;
type Config = { configurable: { thread_id: string }; context: AgentContext };
/** What one node changed, from stream({ streamMode: "updates" }). */
type Update = Record<string, { messages?: Message[] } | undefined>;

/** Runs the graph, sending a step for each tool as it starts and finishes, then where it stopped. */
async function* follow(config: Config, graphInput: Parameters<typeof agentGraph.stream>[0]): AsyncGenerator<ChatEvent> {
  try {
    const updates = await agentGraph.stream(graphInput, { ...config, streamMode: "updates" });
    for await (const update of updates as AsyncIterable<Update>) {
      for (const call of pendingToolCalls(update.agent?.messages ?? [])) yield step(call);
      for (const result of toolResults(update.tools?.messages ?? [])) {
        yield { type: "step_done", id: result.tool_use_id, ok: !result.is_error };
      }
    }

    const changes = await pendingChanges(config);
    if (changes) return yield turn({ kind: "confirm", changes });
    const state = await agentGraph.getState(config);
    yield turn({ kind: "reply", text: lastReply(state.values.messages) });
  } catch (cause) {
    console.error("Agent run failed", cause);
    yield turn(FAILED);
  }
}

type ToolResult = Anthropic.Beta.BetaToolResultBlockParam;

function toolResults(messages: Message[]): ToolResult[] {
  const results: ToolResult[] = [];
  for (const message of messages) {
    if (!Array.isArray(message.content)) continue;
    for (const block of message.content) if (block.type === "tool_result") results.push(block);
  }
  return results;
}

/** Checks the person is signed in and can see the building, then builds the graph's config. */
async function configFor(supabase: Client, input: Conversation): Promise<Config | ChatTurn> {
  // The route can be called directly, so this can't rely on the page having checked.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return error("You're signed out. Sign in again to keep chatting.");

  const [{ data: building }, { data: profile }] = await Promise.all([
    supabase.from("buildings").select("id").eq("id", input.buildingId).maybeSingle(),
    // Their chat settings. Read here, not sent by the chat, so they always match what's saved.
    supabase.from("profiles").select("confirm_mode").eq("id", userId).maybeSingle(),
  ]);
  if (!building) return error("That building wasn't found.");

  return {
    // The thread is tied to the person, so nobody can pick up someone else's conversation.
    configurable: { thread_id: `${userId}:${input.threadId}` },
    // confirmMode() falls back to the default if the saved value isn't a level.
    context: { buildingId: input.buildingId, supabase, today: "today" in input ? input.today : undefined, confirmMode: profile?.confirm_mode as ConfirmMode | undefined },
  };
}

/** Longest chat title before it's cut short. */
const TITLE_LENGTH = 80;

/** The first message, on one line and cut short, names the chat in the "past chats" list. */
export function chatTitle(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : line;
}

/**
 * Lists the chat in the person's past chats: adds it on the first message, and moves it to the top
 * after that. The conversation itself is saved by the graph. A failure here only affects the list,
 * so it's logged and the chat goes on.
 */
async function saveChat(supabase: Client, input: Conversation) {
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase.from("chats").update({ updated_at: now }).eq("id", input.threadId).select("id");
  if (updateError) return console.error("Saving the chat to the list failed", updateError);
  // Only messages start a chat. An answer always follows a message, so its chat already exists.
  if (updated.length > 0 || !("text" in input)) return;
  const { error: insertError } = await supabase.from("chats").insert({ id: input.threadId, building_id: input.buildingId, title: chatTitle(input.text) });
  if (insertError) console.error("Saving the chat to the list failed", insertError);
}

async function pendingChanges(config: Config): Promise<PendingChange[] | undefined> {
  const state = await agentGraph.getState(config);
  return state.tasks.flatMap((task) => task.interrupts).at(0)?.value as PendingChange[] | undefined;
}
