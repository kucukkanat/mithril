# mithril

The batteries-included meta-package — one import for the blessed path. Re-exports `@mithril/core`
(the protocol + agent loop) and exposes provider handles as subpaths so unused providers tree-shake out.

```ts
import { agent, tool } from "mithril";
import { openai } from "mithril/openai"; // or mithril/anthropic
import { z } from "zod"; // any Standard Schema validator

const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 21 }),
});

const assistant = agent({ model: openai("gpt-4o"), instructions: "Be concise.", tools: [weather] });

const result = await assistant.run("Weather in Istanbul?"); // key from OPENAI_API_KEY
if (result.status === "completed") console.log(result.output);
// or stream:  for await (const e of assistant.stream("…").events) …
```

Apps with dependencies bind them once:

```ts
import { createHarness } from "mithril";
const { agent, tool } = createHarness<AppDeps>(); // ctx.deps is typed everywhere; no per-call <Deps>()
```

## What you get

Typed tools, streaming, real model calls, human-in-the-loop approval, structured output, middleware &
plugins, sealed run tokens — all from `mithril`. Reach for the individual `@mithril/*` packages
(`/memory`, `/evals`, `/fs`, `/kv`, `/otel`, `/react`, `/workflows`, `/mcp`) when you need them.

## Entrypoints

`mithril` (core) · `mithril/openai` · `mithril/anthropic` — `openai("gpt-4o")` / `anthropic("claude-…")`
return self-wiring model handles. `mithril/transformers` — `transformers("…")` for on-device inference.
`mithril/devtools/attach` — a side-effect import that zero-touch attaches the devtools inspector.
