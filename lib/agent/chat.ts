import { Command } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as z from "zod";
import type { Database } from "@/lib/supabase/database.types";
import type { AgentContext } from "./context";
import { agentGraph } from "./graph";
import type { PendingChange } from "./nodes/humanReview";
import { lastReply } from "./state";

// What the chat calls (through the server actions in features/chat/actions.ts). Each call
// checks who's asking and what they sent, runs the graph, and returns one of:
// - a reply to show
// - changes waiting on the confirm card (the graph is paused until answerCard)
// - an error to show instead

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

export type MessageInput = z.input<typeof messageInput>;
export type AnswerInput = z.input<typeof answerInput>;

const error = (message: string): ChatTurn => ({ kind: "error", message });
const FAILED = error("Something went wrong. Try again in a moment.");

/** Sends the person's message and runs the agent until it replies or needs the confirm card. */
export async function sendMessage(supabase: Client, raw: unknown): Promise<ChatTurn> {
  const input = messageInput.safeParse(raw);
  if (!input.success) return error("That message couldn't be sent.");
  return run(supabase, input.data, async (config) => {
    if (await pendingChanges(config)) return error("Answer the confirm card first.");
    await agentGraph.invoke({ messages: [{ role: "user", content: input.data.text }] }, config);
  });
}

/** Answers the confirm card and runs the agent on from where it paused. */
export async function answerCard(supabase: Client, raw: unknown): Promise<ChatTurn> {
  const input = answerInput.safeParse(raw);
  if (!input.success) return error("That answer couldn't be sent.");
  return run(supabase, input.data, async (config) => {
    const changes = await pendingChanges(config);
    if (!changes) return error("There's nothing waiting for an answer.");
    const answered = changes.every((change) => input.data.decisions[change.toolCallId]);
    if (!answered) return error("Answer every change on the card.");
    await agentGraph.invoke(new Command({ resume: input.data.decisions }), config);
  });
}

type Conversation = z.infer<typeof messageInput> | z.infer<typeof answerInput>;
type Config = { configurable: { thread_id: string }; context: AgentContext };

/** Runs one step of the conversation, then reads where the graph stopped: a reply, or the card. */
async function run(supabase: Client, input: Conversation, step: (config: Config) => Promise<ChatTurn | void>): Promise<ChatTurn> {
  const config = await configFor(supabase, input);
  if ("kind" in config) return config;
  try {
    const stopped = await step(config);
    if (stopped) return stopped;
    const changes = await pendingChanges(config);
    if (changes) return { kind: "confirm", changes };
    const state = await agentGraph.getState(config);
    return { kind: "reply", text: lastReply(state.values.messages) };
  } catch (cause) {
    console.error("Agent run failed", cause);
    return FAILED;
  }
}

/** Checks the person is signed in and can see the building, then builds the graph's config. */
async function configFor(supabase: Client, input: Conversation): Promise<Config | ChatTurn> {
  // A server action can be called directly, so this can't rely on the page having checked.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return error("You're signed out. Sign in again to keep chatting.");

  const { data: building } = await supabase.from("buildings").select("id").eq("id", input.buildingId).maybeSingle();
  if (!building) return error("That building wasn't found.");

  return {
    // The thread is tied to the person, so nobody can pick up someone else's conversation.
    configurable: { thread_id: `${userId}:${input.threadId}` },
    context: { buildingId: input.buildingId, supabase, today: input.today },
  };
}

async function pendingChanges(config: Config): Promise<PendingChange[] | undefined> {
  const state = await agentGraph.getState(config);
  return state.tasks.flatMap((task) => task.interrupts).at(0)?.value as PendingChange[] | undefined;
}
