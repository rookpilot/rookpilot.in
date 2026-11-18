// Compiles the agent graph and writes agent-graph.html to see it drawn.
//
//   npm run agent:graph && explorer.exe agent-graph.html

import { writeFileSync } from "node:fs";
import { agentGraph } from "../lib/agent/graph";

async function main() {
  const mermaid = (await agentGraph.getGraphAsync()).drawMermaid();
  writeFileSync(
    "agent-graph.html",
    `<!doctype html>
<meta charset="utf-8">
<title>Rookpilot agent graph</title>
<pre class="mermaid">
${mermaid}
</pre>
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true });
</script>
`,
  );
  console.log("Wrote agent-graph.html");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
