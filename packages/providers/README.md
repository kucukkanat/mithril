# @mithril/providers

Streaming provider adapters. Each exposes a self-wiring model handle (`openai("gpt-4o")`) so an agent needs
no registry — just reference the model.

```ts
import { agent } from "mithril";
import { openai } from "@mithril/providers/openai"; // or /anthropic, /google

const assistant = agent({ model: openai("gpt-4o"), instructions: "Be concise.", tools: [/* … */] });

await assistant.run("…", {
  deps: undefined,
  transport: { kind: "byok", apiKey: process.env.OPENAI_API_KEY! }, // or a proxy / ephemeral-token transport
});
```

## Providers

| Import | Models | Notes |
|---|---|---|
| `@mithril/providers/openai` | `openai("gpt-4o")` | + any OpenAI-compatible endpoint (set `transport.baseUrl`) |
| `@mithril/providers/anthropic` | `anthropic("claude-…")` | auto-injects the browser direct-access header |
| `@mithril/providers/google` | `google("gemini-2.0-flash")` | Gemini `streamGenerateContent` |

Each parses the vendor's streaming SSE into Mithril `ProviderChunk`s (text, tool-call fragments accumulated
into one call, usage, finish reason). The loop stamps the ids/ordering.

## Transports

`byok` (direct — great for a user's own key / dev), `proxy` (production browser path), `ephemeral` (vended
short-lived tokens). The only runtime dependency is `RuntimeAdapter.fetch`, which is injectable — that's how
the tests drive real parsing with zero network.

**Known gap:** tool parameters are sent as a permissive `{ type: "object" }` schema; a Standard-Schema →
JSON-Schema converter is a follow-up.
