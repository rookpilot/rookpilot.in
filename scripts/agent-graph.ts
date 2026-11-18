// Shows the agent graph and runs one message through it.
//
//   npm run agent:graph                         # the default example
//   npm run agent:graph -- "my message here"    # try your own
//
// Paste the diagram into https://mermaid.live to see it drawn.
// Running a message calls Claude, so it needs ANTHROPIC_API_KEY in .env.local.
// With LANGSMITH_TRACING=true (and a key) the run also shows up at smith.langchain.com.

import { agentGraph } from "../lib/agent/graph";
import { lastReply } from "../lib/agent/state";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: fine for the diagram.
}

const message = process.argv[2] ?? "How often should I change my furnace filter?";

async function main() {
  const drawable = await agentGraph.getGraphAsync();
  console.log("── Graph (Mermaid) ──────────────────────────\n");
  console.log(drawable.drawMermaid());

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Add ANTHROPIC_API_KEY to .env.local to run a message through the graph.");
    return;
  }

  console.log(`── Run: "${message}" ──\n`);
  const out = await agentGraph.invoke({ messages: [{ role: "user", content: message }] });
  console.log(`── Reply ──\n\n${lastReply(out.messages)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
