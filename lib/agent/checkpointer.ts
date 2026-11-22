import { MemorySaver, type BaseCheckpointSaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// Where the graph saves each conversation: messages, tool calls, and a waiting confirm card.
//
// With DATABASE_URL set, it saves to the `agent` schema in Supabase, so chats survive restarts and
// work across servers. The migration `chats` makes those tables, so setup() is never needed.
// Without it (tests, the graph script), it keeps them in memory and they're lost on restart.
export function createCheckpointer(url = process.env.DATABASE_URL): BaseCheckpointSaver {
  if (!url) {
    if (process.env.NODE_ENV === "production") console.warn("DATABASE_URL isn't set, so chats are only kept in memory.");
    return new MemorySaver();
  }
  return PostgresSaver.fromConnString(url, { schema: "agent" });
}
