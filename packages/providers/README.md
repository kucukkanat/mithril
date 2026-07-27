# @mithril/providers

Streaming provider adapters. Each exposes a self-wiring model handle (`openai("gpt-4o")`) so an agent needs
no registry — just reference the model.

```ts
import { agent } from "mithril";
import { openai } from "@mithril/providers/openai"; // or /anthropic, /google, /deepseek, /openrouter

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
| `@mithril/providers/deepseek` | `deepseek("deepseek-chat")` | `deepseek-reasoner` streams reasoning |
| `@mithril/providers/openrouter` | `openrouter("anthropic/claude-sonnet-4.5")` | many vendors behind one key; optional `appUrl`/`appName` attribution |

Each parses the vendor's streaming SSE into Mithril `ProviderChunk`s (text, tool-call fragments accumulated
into one call, usage, finish reason). The loop stamps the ids/ordering.

The BYOK fallback reads `<PROVIDER>_API_KEY` off the handle's id prefix — `DEEPSEEK_API_KEY`,
`OPENROUTER_API_KEY`, and so on — so omitting `transport` entirely is usually all you need on Node/Bun.
OpenRouter model ids are themselves `vendor/model`; only the `openrouter/` prefix is stripped on the wire,
so `openrouter("anthropic/claude-sonnet-4.5")` reaches OpenRouter with the vendor half intact.

**Reasoning models.** DeepSeek streams its chain of thought as `reasoning_content` and OpenRouter as
`reasoning`; both surface as the protocol's `reasoning.delta` chunks (`reasoning` events on the public
stream) before the answer text, so consumers never branch on which service produced the stream.

## Transports

`byok` (direct — great for a user's own key / dev), `proxy` (production browser path), `ephemeral` (vended
short-lived tokens). The only runtime dependency is `RuntimeAdapter.fetch`, which is injectable — that's how
the tests drive real parsing with zero network.

**Tool schemas:** tool parameters are converted precisely when the input schema self-describes (see
`withJsonSchema`) or a `toolSchema` converter is supplied (e.g. `openai("gpt-4o", { toolSchema: z.toJSONSchema })`),
falling back to a permissive `{ type: "object" }` schema otherwise.
