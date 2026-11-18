// Shows the agent graph and runs one message through it.
//
//   npm run agent:graph                         # the smoke alarm example
//   npm run agent:graph -- "my message here"    # try your own
//
// Paste the diagram into https://mermaid.live to see it drawn.
// Running a message calls Claude, so it needs ANTHROPIC_API_KEY in .env.local.

import { agentGraph } from "../lib/agent/graph";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: fine for the diagram.
}

const message = process.argv[2] ?? "The hallway smoke alarm was chirping, I swapped the battery";

async function main() {
  const drawable = await agentGraph.getGraphAsync();
  console.log("── Graph (Mermaid) ──────────────────────────\n");
  console.log(drawable.drawMermaid());

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("Add ANTHROPIC_API_KEY to .env.local to run a message through the graph.");
    return;
  }

  console.log(`── Run: "${message}" ──\n`);
  // "updates" mode yields one chunk per node as it finishes: { nodeName: whatItChanged }.
  let reply = "";
  for await (const chunk of await agentGraph.stream({ message }, { streamMode: "updates" })) {
    for (const [node, update] of Object.entries(chunk)) {
      console.log(`→ ${node}`, update);
      if (update && "reply" in update && typeof update.reply === "string") reply = update.reply;
    }
  }
  console.log(`\n── Reply ──\n\n${reply}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
