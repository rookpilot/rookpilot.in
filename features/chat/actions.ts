"use server";

import * as chat from "@/lib/agent/chat";
import { createClient } from "@/lib/supabase/server";

// The chat panel's way to talk to the agent. Runs on the server, with the signed-in
// person's Supabase client, so the API key and the database rules stay server-side.

export async function sendMessage(input: chat.MessageInput): Promise<chat.ChatTurn> {
  return chat.sendMessage(await createClient(), input);
}

export async function answerCard(input: chat.AnswerInput): Promise<chat.ChatTurn> {
  return chat.answerCard(await createClient(), input);
}
