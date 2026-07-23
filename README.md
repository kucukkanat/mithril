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

// `run` returns a discriminated RunResult — narrow on `status` before reading `output`.
const result = await assistant.run("Weather in Istanbul?");
if (result.status === "completed") console.log(result.output);
```

## Packages

| Package | What it is | Status |
|---|---|---|
| `@mithril/core` (`/protocol`, `/agent`, `/testkit`) | Event protocol + total reducers, the agent loop, tools, streaming, HITL, structured output, §3.8 middleware/plugins, sealed tokens | ✅ implemented + tested |
| `@mithril/providers` (`/openai`, `/anthropic`, `/google`, `/transformers`) | Real streaming provider adapters (SSE) + on-device transformers, self-wiring model handles | ✅ implemented + tested |
| `@mithril/memory` (`.`, `/sqlite-bun`) | `Checkpointer` interface + in-memory + **real SQLite** impls + conformance kit | ✅ implemented + tested |
| `@mithril/kv` (`.`, `/indexeddb`) | Runtime-agnostic `KeyValue` (in-memory + IndexedDB + conformance) | ✅ implemented + tested |
| `@mithril/fs` (`.`, `/node`, `/opfs`) | Runtime-agnostic `FileSystem` (in-memory + **real Node/Bun fs** + browser OPFS, conformance) | ✅ implemented + tested |
| `@mithril/vectors` (`.`, `/sqlite-bun`) | Runtime-agnostic vector store (in-memory + **real SQLite**, cosine search, conformance) | ✅ implemented + tested |
| `@mithril/otel` | Fold events → `gen_ai.*` spans | ✅ implemented + tested |
| `@mithril/workflows` | Deterministic code-first routing over agents | ✅ implemented + tested |
| `@mithril/mcp` (`.`, `/http`, `/server`) | MCP client + Streamable-HTTP transport + serve your own tools over MCP | ✅ implemented + tested |
| `@mithril/react` (`.`, `/hooks`) | Headless run-store + `useRun`/`useObject` hooks | ✅ store tested; hooks typechecked |
| `@mithril/devtools` (`.`, `/dom`, `/element`, `/ui`, `/attach`) | Headless inspector + embeddable event-stream UI + zero-touch attach | ✅ implemented + tested |
| `@mithril/sandbox` (`.`, `/node`) | `CodeRunner` interface + Node VM + remote runners | ✅ implemented + tested |
| `mithril` | The blessed meta-package (one-import path) | ✅ implemented + tested |
| `create-mithril` | Scaffold a runnable app | ✅ implemented + tested |

**Capabilities that work today:** typed tools with inferred I/O, streaming, real model calls (OpenAI,
Anthropic, Google) plus on-device inference via transformers.js, all three human-in-the-loop tiers
(approval, tool-returned `suspend`, mid-execute `ctx.suspend`) with first-class nested `asTool` resume and
resumable tokens (unsigned by default; opt-in HMAC/AES-GCM sealing), typed structured output with
validate→retry and streamed `object.delta`, step/tool/model-altitude middleware + plugin bundling + event
consumers, a portable Checkpointer (in-memory + SQLite), OTel spans, runtime-agnostic
KV/FS/vector adapters (in-memory + real Node/Bun + browser IndexedDB/OPFS), deterministic workflows, an MCP
client + server, React bindings, a devtools inspector, and a scaffolder.

**Remaining follow-ups:** durable persistence wired directly into `run()` (the `Checkpointer` ships, but the
loop doesn't call it yet — durability is BYO glue today), a standalone studio app, ANN-indexed vector
backends (sqlite-vec / pgvector / Vectorize), and realtime/voice. These are scoped work, not blockers.

## Develop

```bash
bun install
bun test          # runs the whole suite (zero network — providers are tested via injected fetch)
bun run typecheck  # strict tsc across every package
```

Everything is TypeScript at maximum strictness (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noPropertyAccessFromIndexSignature`). Design docs
live in [`docs/design`](docs/design); the market research in [`docs/research`](docs/research).
