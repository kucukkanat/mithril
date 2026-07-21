# create-mithril

Scaffold a runnable Mithril app in seconds.

```bash
bun create mithril my-agent            # node-cli template (default)
bun create mithril my-agent react-chat # or: node-cli | bun-server | react-chat

cd my-agent && bun install
OPENAI_API_KEY=… bun run start
```

You get a working streaming agent in a handful of lines:

```ts
// src/agent.ts
import { agent, tool } from "mithril";
import { openai } from "mithril/openai";
import { z } from "zod";

const weather = tool({ name: "weather", description: "…", inputSchema: z.object({ city: z.string() }), execute });
export const assistant = agent({ model: openai("gpt-4o"), instructions: "…", tools: [weather] });
```

## Programmatic

```ts
import { scaffold, createApp } from "create-mithril";
const files = scaffold("node-cli", "demo");   // → { "package.json": "...", "src/agent.ts": "..." }
await createApp("node-cli", "demo", "./demo"); // writes them to disk
```
