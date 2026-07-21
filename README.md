# Mithril

The most developer-friendly AI agent harness — batteries-included, TypeScript-first, and genuinely
runtime-agnostic (Node, Bun, browsers). The typed event protocol is the product; everything else consumes it.

```ts
import { agent, tool } from "mithril";
import { openai } from "mithril/openai";
import { z } from "zod"; // any Standard Schema validator

const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => getWeather(city),
});

const assistant = agent({ model: openai("gpt-4o"), instructions: "Be concise.", tools: [weather] });
const { output } = await assistant.run("Weather in Istanbul?");
```

## Packages

| Package | What it is | Status |
|---|---|---|
| `@mithril/core` (`/protocol`, `/agent`, `/testkit`) | Event protocol + total reducers, the agent loop, tools, streaming, HITL, structured output, §3.8 middleware/plugins, sealed tokens | ✅ implemented + tested |
| `@mithril/providers` (`/openai`, `/anthropic`) | Real streaming provider adapters (SSE), self-wiring model handles | ✅ implemented + tested |
| `@mithril/memory` (`.`, `/sqlite-bun`) | `Checkpointer` interface + in-memory + **real SQLite** impls + conformance kit | ✅ implemented + tested |
| `@mithril/evals` | Trajectory-native evals: `runEval`, `describeEval`, scorers | ✅ implemented + tested |
| `@mithril/kv` | Runtime-agnostic `KeyValue` (in-memory + conformance) | ✅ implemented + tested |
| `@mithril/fs` (`.`, `/node`) | Runtime-agnostic `FileSystem` (in-memory + **real Node/Bun fs**, conformance) | ✅ implemented + tested |
| `@mithril/otel` | Fold events → `gen_ai.*` spans | ✅ implemented + tested |
| `@mithril/workflows` | Deterministic code-first routing over agents | ✅ implemented + tested |
| `@mithril/mcp` | MCP client — expose MCP server tools as Mithril tools | ✅ implemented + tested |
| `@mithril/react` (`.`, `/hooks`) | Headless run-store + `useRun`/`useObject` hooks | ✅ store tested; hooks typechecked |
| `mithril` | The blessed meta-package (one-import path) | ✅ implemented + tested |
| `create-mithril` | Scaffold a runnable app | ✅ implemented + tested |

**Capabilities that work today:** typed tools with inferred I/O, streaming, real model calls (OpenAI,
Anthropic, Google), human-in-the-loop approval with sealed resumable tokens (HMAC + AES-GCM), typed
structured output with validate→retry and streamed `object.delta`, tool- and model-altitude middleware +
plugin bundling + event consumers, a portable Checkpointer (in-memory + SQLite), trajectory evals, OTel
spans, runtime-agnostic KV/FS adapters (in-memory + real Node/Bun + browser OPFS), deterministic workflows,
an MCP client, React bindings, and a scaffolder.

**Remaining follow-ups:** `@mithril/devtools` (the visual inspector UI), IndexedDB kv adapter, Tier-1b/Tier-2
HITL, the step-altitude middleware, a Standard-Schema → JSON-Schema converter for provider tool params, and
a live end-to-end LLM call (needs keys). These are scoped work, not blockers.

## Develop

```bash
bun install
bun test          # runs the whole suite (zero network — providers are tested via injected fetch)
bun run typecheck  # strict tsc across every package
```

Everything is TypeScript at maximum strictness (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noPropertyAccessFromIndexSignature`). Design docs
live in [`docs/design`](docs/design); the market research in [`docs/research`](docs/research).
