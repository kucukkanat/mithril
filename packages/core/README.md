# @mithril/core

The heart of Mithril: the typed event **protocol** (`@mithril/core/protocol`) and the agent loop
(`@mithril/core/agent`). Tools, streaming, structured output, human-in-the-loop, middleware/plugins, and
sealed run tokens all live here. Everything else in Mithril is a consumer of the protocol.

## `@mithril/core/protocol`

Pure types and **total** functions — zero side effects, zero `fetch`, no `node:` APIs. It runs identically on Node, Bun, and browsers because it touches nothing runtime-specific. Everything else in Mithril is a consumer of this.

### State is a fold over the event log

`reduce`/`replay` turn the recorded `MithrilEvent` stream into `RunState`. There is no separately-stored mutable state to desync, so time-travel is free and always correct:

```ts
import { replay, type MithrilEvent } from "@mithril/core/protocol";

const state = replay(log);            // full fold → final RunState
const atStep2 = replay(log, 12);      // time-travel: fold up to seq 12
```

`reduce` is **total** — an unrecognized event type (a future additive member) is inert, never a throw — and **span-routed**, so a sub-agent's events accrue to `state.subruns[...]` instead of corrupting the root run.

### Recover per-tool types locally with `narrow`

The wire is monomorphic (`input`/`output` are `JsonValue`) so the global event union never melts `tsc`. Where you actually need the typed input, `narrow` is a type predicate:

```ts
import { narrow } from "@mithril/core/protocol";

for (const e of log) {
  if (narrow(e, tools)) {
    // e.name is 'search' | 'echo'; e.input is narrowed to that tool's input
  }
}
```

### Cross-runtime event transport

```ts
import { inMemoryTransport, assertContiguous } from "@mithril/core/protocol";

const bus = inMemoryTransport();
const off = bus.subscribe((e) => render(e), /* resumeFrom */ 0); // gap-free catch-up
```

## `@mithril/core/agent`

Define tools and agents; `run()` awaits, `stream()` gives a live handle. Providers are pluggable — a handle self-wires:

```ts
import { agent, tool } from "@mithril/core/agent";
import { z } from "zod"; // any Standard Schema validator

const search = tool({
  name: "search",
  description: "Search the web.",
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => ({ hits: await webSearch(query) }), // Out inferred: { hits: … }
});

const assistant = agent({ model, instructions: "Be concise.", tools: [search] });

const result = await assistant.run("Best noise-cancelling headphones?");
if (result.status === "completed") console.log(result.output);
// or stream:
const run = assistant.stream("…");
for await (const delta of run.text) process.stdout.write(delta);
```

### Structured output

Pass an `output` schema and the agent returns a **typed value** (validate → retry on failure):

```ts
const a = agent({ model, instructions: "…", output: z.object({ city: z.string(), temp: z.number() }) });
const res = await a.run("weather in NYC");
if (res.status === "completed") {
  res.output; // typed { city: string; temp: number } — inferred from the schema
}
```

Invalid model output emits `object.invalid` and retries (default 2) with the validation error fed back;
persistent failure returns `{ status: "error" }`.

### Human-in-the-loop (Tier-1 approval)

A tool marked `needsApproval` **suspends before it runs**. The run returns a resumable token; approve/reject/edit continues it:

```ts
const deploy = tool({ name: "deploy", description: "…", inputSchema, needsApproval: true, execute });
const a = agent({ model, instructions: "…", tools: [deploy] });

const r = await a.run("deploy to prod");
if (r.status === "suspended") {
  // r.request.payload = { name, input } — render the approval; nothing has executed yet
  const done = await a.resume(r.token, { kind: "approve" });          // or { kind: "reject", message } / { kind: "edit", input }
}
```

### Compose with middleware & plugins (§3.8)

Middleware wraps four altitudes — **model**, **tool**, **step**, and **finalize** (structured-output
validation). It can transform or short-circuit, `steer`/`halt` the run, and only ever reads/emits events —
no hidden side channel. The built-in **self-healing stack is just middleware** (`healing.harmonyRepair`, `healing.argRepair`,
`healing.loopGuard`, `healing.retryBudget`, `healing.outputRetry` — five behaviors), installed by default and fully
pluggable via the `healing` field (`false`/`[]` for a raw loop, or an explicit array to pick/configure).
A `plugin()` bundles tools + middleware + consumers behind one `use:`.

```ts
const guardrail: Middleware = {
  name: "guardrail",
  tool: async (ctx, call, next) => (isBlocked(call) ? { callId: call.callId, status: "error", error: block } : next(call)),
};
const cache: Middleware = { name: "cache", model: async (ctx, call, next) => (await hit(call)) ?? next(call) };

// batteries-included healing by default; opt into a raw loop or a custom stack via `healing`:
const a = agent({ model, instructions: "…", tools: [/* … */], use: [cache, guardrail, ragPlugin()] });
const raw = agent({ model, instructions: "…", tools: [/* … */], healing: false }); // no self-correction
```

The loop is exercised end-to-end in tests with a **scripted provider** (`@mithril/core/testkit`) — no network, fully deterministic:

```ts
import { scriptedProvider, testModel, textTurn, toolCallTurn } from "@mithril/core/testkit";

// textTurn / toolCallTurn build the text.delta + message.end pairs for you (no hand-written usage object):
const model = testModel(scriptedProvider([
  toolCallTurn("search", { query: "x" }),
  textTurn("Here you go"),
]));
```

## Develop

```bash
bun test                                        # run the suite (no install needed)
bunx tsc --noEmit -p packages/core/tsconfig.json # strict type-check (incl. the inference fixture)
```

All source is TypeScript at maximum strictness (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, …). The only dependency is a types-only Standard Schema contract (vendored locally for now; the published package re-exports `@standard-schema/spec`).
