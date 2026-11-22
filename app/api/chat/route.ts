import { streamAnswer, streamMessage, type ChatEvent, type ChatRequest } from "@/lib/agent/chat";
import { createClient } from "@/lib/supabase/server";

// The chat's line to the agent. Streams events as the agent works (one JSON object per line),
// so the chat can show each step before the reply arrives. Checks the person in lib/agent/chat.ts.

/** A turn with several rounds of tools can take a while. */
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ChatRequest> | null;
  const supabase = await createClient();
  const events = body?.action === "answer" ? streamAnswer(supabase, body.input) : streamMessage(supabase, body?.input);
  return new Response(toLines(events), {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Sends each event as soon as it's ready, and stops following the run if the person leaves. */
function toLines(events: AsyncGenerator<ChatEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await events.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
    },
    async cancel() {
      await events.return(undefined);
    },
  });
}
