# Mithril v1 — Design Specification

**Status:** Locked build document. This is the single source of truth v1 is built from.
**Synthesis basis:** Backbone = **P4 (protocol-first)** — the majority winner (2 of 3 judges) and the only proposal that treats type-instantiation collapse as a first-class design constraint. Grafted, per the judge scorecards: **P1** ergonomics (three-noun surface, `asTool`, `agentLoop` ejection, named prompt constants), **P2** portability (`Transport`/`RuntimeAdapter` seams, `browserSafe`, the executed workerd+browser CI gate, abort-wins-over-suspend atomic commit), and **P3** hardening (the ordered `open()` trust boundary, `needsApproval` boundary HITL, `upSuspension` migrations, optimistic-concurrency `Checkpointer` + conformance kit).

**Revision note (post red-team).** This revision closes all blockers surfaced by three adversarial passes (consumer-code, type-design, runtime-portability). The load-bearing changes: (1) provider resolution and a suspension-schema registry are now first-class run inputs — a `ModelId` and a custom suspension are reachable from the public surface; (2) `Deps` and `Susp` each acquire exactly one honest binding site (curried factory + `suspends` field), so typed DI and typed resume stop degrading silently to `unknown`/`ApprovalRequest`; (3) `narrow()` becomes a type predicate; (4) durability is a discriminated `persistence` input so the signing key is structurally required exactly when it is needed; (5) the seal envelope signs the transmitted bytes so verify-before-parse actually holds; (6) `subtle` is optional and demanded only at seal/open, unbreaking insecure-context browsers; (7) the portability gate executes inside workerd and an insecure-context browser instead of statically scanning imports; (8) `MithrilEvent` gets a declared, non-exhaustive evolution contract; (9) streaming gets an explicit two-class backpressure policy. See §13 for deliberate rejections.

The through-line: **the typed, versioned event stream is the product.** The loop is the one producer of it; devtools, React, and OTel are pure consumers. State is never separately stored — it is always `replay(log, cursor)`.

---

## 1. Principles (non-negotiable, enforced)

1. **The protocol is the product.** `MithrilEvent` is the only public wire format. Every surface (devtools, `@mithril/react`, `@mithril/otel`) consumes this exact union and may not import the loop. Enforced by the `exports` map, not convention. The union evolves under a **declared non-exhaustive contract** (§4.2) so additive members are minor, not major.
2. **State = `replay(log, cursor)`.** A pure, total fold. Never a separately-stored mutable checkpoint that can desync. Time-travel is free and always correct by construction. Append-only logs also structurally dodge the abort/suspend half-written-checkpoint corruption race.
3. **Monomorphic wire, opt-in local typing.** Wire events carry `input`/`output` as `JsonValue`. The global union never indexes over a tool record — this is the deliberate defense against the tRPC/Hono type-instantiation collapse. Per-tool types are recovered *locally and on demand* via `narrow()` (a type predicate) / `ToolCallFor<Tools>`, so tsc pays instantiation cost only where a call-site asks for it.
4. **Three nouns, progressive disclosure by argument.** `tool`, `agent`, `run`. Every escalation is one *argument* (`output`, `onStep`, `deps`), never one import. Typed DI is bound with one *curried call* (`agent<Deps>()(config)`) — the only exception to "one argument," accepted because there is no config field from which `Deps` can otherwise be inferred (§3.4, §13). The escape hatch (`agentLoop`) is always exactly one layer down, emitting the byte-identical event stream — ejection is a copy, not a rewrite.
5. **No hidden prompts.** Every injected string is a named, exported, overridable constant (`DEFAULT_PROMPTS`). `instructions` is the sole source of the system prompt; `Input` carries no `system` role.
6. **Web-standards-only core, proven by execution.** `fetch`, WebStreams, `AbortSignal`, WebCrypto (`getRandomValues` always; `subtle` only at seal/open), `structuredClone`. Zero `node:` imports, zero storage engine, zero runtime deps beyond `@standard-schema/spec` (types only). The portability gate **executes** `/protocol`+`/agent` golden trajectories inside a real workerd isolate and inside a headless browser served over **both https and plain http (insecure context)** — a static `node:`-import scan is kept only as a fast pre-filter, never as the contract. If it can't run client-side in an insecure context, it isn't in core.
7. **Suspension is a value, not an exception.** It surfaces as a discriminated `RunResult` branch you cannot ignore at the type level. No `interrupt()` footgun; no replay-from-start for the blessed paths.
8. **Verify before parse.** Every persisted byte is length-capped, HMAC-verified **over the exact transmitted bytes**, prototype-pollution-stripped, version-gated, migrated, and schema-revalidated *before* it is trusted — in that order. No canonicalization step precedes verification (that would require parsing hostile bytes first). Directly closes the LangGraph checkpointer SQLi→RCE class.
9. **Two-altitude runner.** `await` for the 90%; `iterate()` (step-level pause/mutate/inject) for the 10%. Same events underneath.
10. **Typed DI, no globals.** `RunContext<Deps>` threads dependencies into tools and dynamic instructions. `deps` are re-injected on every run/resume (via `RunOptions`, never deserialized). `Deps` has exactly one binding site — the curried `agent<Deps>()` factory — so it flows to tools and context without positional type args and without killing `const Tools` capture.
11. **OTel `gen_ai.*` native.** Span linkage (`id`/`parentId`/`traceId`/`kind`) rides on every event; metadata on by default, content opt-in.
12. **Determinism is injectable.** `now()`, `randomUUID()`, `getRandomValues()`, `fetch`, and (optionally) `subtle` come from a `RuntimeAdapter`, so replay reproduces a trajectory byte-for-byte and workerd stays happy. `defaultRuntime()` keeps the common path zero-config and binds Web APIs to `globalThis` to avoid detached-`this` illegal-invocation.

**Anti-patterns explicitly avoided:** tool-name-indexed generics in the global union; rename-heavy majors; `experimental_` treadmill; hard-to-eject monolith; multiple state-schema generations; nominal runtime support that fails on contact; typed features (DI, typed resume) that lack an inference site and silently degrade to defaults.

---

## 2. Package map

Boundaries are enforced by **entrypoints**, not discipline. ESM-only, strict `exports`, no deep imports.

```
@mithril/core
  /protocol   ← THE PRODUCT. types + pure total functions. zero side effects,
                zero fetch, zero provider code, no node: API. Everything imports this.
  /agent      ← the ONE producer: tool, agent, run, agentLoop, iterate, resume.
                depends on /protocol. NOTHING else may import /agent.
  /testkit    ← protocol conformance suite + frozen golden event-log corpus.

@mithril/providers        anthropic / openai / google. capability-flagged (incl. browserSafe).
                          expose Provider impls + a providerRegistry() builder that RunOptions
                          consumes. 'provider/model' routing over a tiny published provider spec.
                          ALSO producers of MithrilEvents — gated by /testkit conformance.
@mithril/compat-ai-sdk    wrap Vercel AI SDK models as a Mithril Provider.
@mithril/mcp              client, 2026-07-28 stateless spec. MCP tools surface as Tools;
                          calls appear as ordinary tool.call/tool.result events.
@mithril/memory           Checkpointer interface + conformance kit (shipped in core, impls here).
                          runtime backends behind EXPLICIT per-runtime subpaths:
                            /memory      (in-mem, also in core for dev)
                            /sqlite-node (node:sqlite)   ← split; no single-subpath runtime branching
                            /sqlite-bun  (bun:sqlite)
                            /opfs        (IndexedDB + OPFS)
                            /kv          (workerd KV/DO — honors the matrix for durability)
@mithril/fs               runtime-agnostic FileSystem for tools (interface + conformance kit + /memory).
                          runtime backends behind EXPLICIT per-runtime subpaths (same rule as /memory):
                            /node  (fs/promises, root-confined)   /bun  (Bun.file + node:fs)
                            /opfs  (navigator.storage OPFS)       (workerd: r2FileSystem or none)
                          async-only, path-based, ROOTED (can't escape its base); Uint8Array + Web Streams.
                          injected via Deps (ctx.deps.fs), NOT on RuntimeAdapter (fs isn't universal).
@mithril/kv               runtime-agnostic KeyValue for tools (caches, dedup, counters, scratch). §10.2.
                            /memory · /indexeddb (browser) · /sqlite-node · /sqlite-bun · /kv (workerd)
@mithril/vectors          (v1.x) VectorStore — the portable RAG core. §10.3.
                            /memory (browser-capable) · /sqlite-vec · /pgvector · /vectorize (workerd)
@mithril/sandbox          (v1.x+) CodeRunner — sandboxed code exec, honest degradation. §10.4.
                            /node (isolated-vm) · /wasm (QuickJS/Pyodide, browser) · /remote (proxy)
@mithril/otel             folds events → gen_ai.* spans. peer: @opentelemetry/api.
@mithril/react            useRun hooks + headless components. imports /protocol ONLY.
                          drivable by a RunHandle OR a bare EventTransport (browser tab renders
                          a run happening in a worker/server it isn't hosting).
@mithril/workflows        deterministic code-first routing composing agents. routing =
                          handoff / custom.route events. sits ABOVE core; never touches loop internals.
@mithril/devtools         bunx mithril dev. single-process, SQLite, offline. Node/Bun only —
                          honestly OUTSIDE the client path.
mithril                   meta-package: re-exports + LAZILY (dynamic import, per-runtime) wires a
                          default provider registry + Checkpointer so the 90% path is one import.
                          Lazy wiring keeps provider pricing tables / node:sqlite out of browser bundles.
create-mithril            scaffolder.
```

**Per-symbol entrypoints** (so "enforced by the exports map" is usable — closes A-F5/R6). `/protocol` is types + pure functions only; everything with a runtime/ambient dependency lives in `/agent`:

| Entrypoint | Exports |
|---|---|
| `@mithril/core/protocol` | `MithrilEvent` & event types, `EventMeta`, `SpanRef`, `RunState`, `reduce`, `replay`, `INITIAL`, `narrow`, `ToolCallFor`, `DeepPartial`, `EventTransport` + transport factories, `assertContiguous`, `assertKnownEvent`, `migrate`, `Trajectory`, `JsonValue`/`JsonSafe`, `ModelId`/`ModelHandle`/`ModelInput`, `Usage*`, `SuspensionRequest`/`SuspensionDescriptor`/`ResolutionOf`/`suspend`/`ApprovalRequest`/`HandoffSuspension`, `SchemaRegistry`/`schemaRegistry`, `SealCodec`/`hmacCodec`/`aesGcmCodec`, `StateMigration`, `ChatRequest`/`ProviderChunk`/`ProviderSpec`/`Provider*`, `ContextPolicy`/`ContextBudget`, `Middleware`/`Plugin`/`MiddlewareContext`/`ModelCall`/`ModelResult`/`ToolInvocation`/`ToolOutcome`/`StepOutcome`/`DraftEvent`/`EventConsumer`/`InferPluginTools`, `InferUITools`/`InferSuspension`, `MithrilError` |
| `@mithril/core/agent` | `tool`, `agent`, `createHarness`, `agentLoop`, `plugin`, `DEFAULT_PROMPTS`, `RuntimeAdapter`, `defaultRuntime`, `Transport`, `Persistence`, `generateStateKey`, `Keyring`/`singleKeyring`, `seal`/`sealLocal`, `open`, `schemaRegistryFor`, `Checkpointer`/`CheckpointRecord`/`checkpointerConformance` |
| `@mithril/core/testkit` | conformance corpus, `seededRuntime` |
| `@mithril/react` | `useRun`, `useObject`, `useApproval`, `useToolCalls` |
| `@mithril/fs` | `FileSystem`, `fileSystemConformance` + subpaths `/node`,`/bun`,`/opfs`,`/memory` (`nodeFileSystem`/`opfsFileSystem`/…) |
| `@mithril/kv` | `KeyValue`, `kvConformance` + subpaths `/memory`,`/indexeddb`,`/sqlite-node`,`/sqlite-bun`,`/kv` |
| `mithril` (meta) | re-exports the blessed path: `agent`/`tool`/`createHarness`/`plugin` + `mithril/anthropic`,`mithril/openai`,`mithril/google` (the `anthropic()`/… handles) + `mithril/devtools/attach` |

**Dependency rule:** consumers depend on `@mithril/core/protocol` only. Adapters (providers/mcp/memory) are peers of `/agent`. Acyclic: core depends on nobody; that acyclicity is what keeps tsc fast and the ejection story honest.

**CI matrix (a contract, not a claim):**
- `/protocol` and `/agent` are type-checked and tested on Node + Bun + browser.
- A **workerd isolate** and an **insecure-context (plain-http) headless browser page** each replay the golden trajectory corpus end-to-end. This is the portability contract; the `node:`-import bundle scan is a pre-filter only.
- A tsc-instantiation benchmark over a **100-tool fixture** gates type-check latency, **and** `@ts-expect-error` golden snapshots assert the *shape* of failure diagnostics (line count, no full-tuple dumps) so generic leakage is caught, not just instantiation count. Conditional/mapped-type depth in `ToolCallFor`/`InferUITools` is explicitly capped.
- A bundle-size budget check runs alongside the tsc budget so the `mithril` meta-package cannot regress browser bundles.

---

## 3. Core public API

### 3.0 The 90% path (start here)

One import from the `mithril` meta-package. No options object, no registry wiring, no per-call `<Deps>()`:

```ts
import { agent, tool } from "mithril";
import { anthropic } from "mithril/anthropic";
import { z } from "zod"; // any Standard Schema validator works

const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => getWeather(city),
});

const assistant = agent({
  model: anthropic("claude-fable-5"),   // self-wires the provider; autocompletes model ids
  instructions: "You are a concise weather assistant.",
  tools: [weather],
});

const { output } = await assistant.run("Weather in Istanbul?");   // API key from ANTHROPIC_API_KEY; no opts
// or stream:  for await (const e of assistant.stream("…")) if (e.type === "text.delta") …
// or in React: const { text, status } = useRun(handle)
```

Apps **with dependencies** bind `Deps` once and never restate it:

```ts
import { createHarness } from "mithril";
interface AppDeps { db: Db }
const { agent, tool } = createHarness<AppDeps>();

const lookup = tool({ name: "lookup", description: "…", inputSchema: z.object({ id: z.string() }),
  execute: async ({ id }, ctx) => ctx.deps.db.get(id) });          // ctx.deps: AppDeps, fully typed
const a = agent({ model: anthropic("claude-fable-5"), instructions: "…", tools: [lookup] });
await a.run("…", { deps: { db } });                                // deps required only because they exist
```

Everything from §3.1 on is the layers *under* this — reach for them only when the 90% path isn't enough.

### 3.1 Shared value types (all JSON-safe)

```ts
// JSON-safe AND structured-clone-safe: no functions, class instances, bigint, or Date.
export type JsonValue =
  | null | boolean | number | string
  | readonly JsonValue[]
  | { readonly [k: string]: JsonValue };

// Compile-time assertion helper applied at factory boundaries that PRODUCE wire values
// (tool output, structured output, suspension payload). Fails at definition, not at structuredClone.
export type JsonSafe<T> = T extends JsonValue ? T : never;

export type ModelId = `${string}/${string}`; // 'anthropic/claude-...', validated at runtime against the provider spec

// A provider-bound model reference. Referencing it SELF-WIRES the provider (no separate providerRegistry
// call) and autocompletes model names. Provider packages export helpers that return one:
//   model: anthropic("claude-fable-5")   // discoverable + auto-wired  (preferred)
//   model: "anthropic/claude-fable-5"    // bare string; config-driven selection, needs a registry
export interface ModelHandle { readonly id: ModelId; readonly provider: Provider }
export type ModelInput = ModelId | ModelHandle;

export type FinishReason =
  | 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';

export interface UsageDelta {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
  readonly reasoning: number;
  readonly costMicroUsd: number; // integer micro-USD — avoids float drift across thousands of deltas
}
export interface UsageTotals extends UsageDelta {
  readonly steps: number;
}

export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly retryable?: boolean;
  readonly data?: JsonValue;
}
```

### 3.2 Runtime & transport seams (graft: P2)

```ts
/** The only ambient-capability seam. Built from globalThis by default; injectable for
 *  deterministic replay and workerd safety. `subtle` is OPTIONAL: getRandomValues is
 *  available in insecure browser contexts, subtle is not — so runId/ULID derive from
 *  getRandomValues and subtle is demanded only inside seal()/open(). */
export interface RuntimeAdapter {
  readonly fetch: typeof fetch;        // web fetch, bound to globalThis (no illegal-invocation)
  readonly now: () => number;          // Date.now, injectable
  readonly randomUUID: () => string;   // v4 built on getRandomValues; safe in insecure contexts
  readonly getRandomValues: <T extends ArrayBufferView | null>(array: T) => T;
  readonly subtle?: SubtleCrypto;      // WebCrypto — required ONLY by seal()/open() (HMAC state sealing)
}
/** Feature-detects secure context. If durable sealing is later requested without `subtle`,
 *  seal()/open() throw a loud, actionable error rather than dereferencing undefined. */
export function defaultRuntime(): RuntimeAdapter;

/** HMAC-SHA256 key helper so consumers don't hand-roll subtle.generateKey/importKey ceremony. */
export function generateStateKey(rt?: RuntimeAdapter): Promise<CryptoKey>;

/** Keyring is the durable-signing seam (OQ-1). Never pass a raw CryptoKey: pass a Keyring so tokens
 *  carry a `kid`, verification can select a RETIRED-but-retained key, and rotation is "add a key, keep
 *  the old ones for verify." `current()` signs; `resolve(kid)` fetches a verify key by envelope kid. */
export interface Keyring {
  current(): Promise<{ readonly kid: string; readonly key: CryptoKey }>; // sign new tokens with this
  resolve(kid: string): Promise<CryptoKey | undefined>;                  // verify: pick by envelope kid
}
/** The 90% single-key keyring; `kid` defaults to a stable hash of the key material. Rotation = build a
 *  keyring whose `current()` is the new key and whose `resolve()` still returns retired keys. */
export function singleKeyring(key: CryptoKey | Promise<CryptoKey>, kid?: string): Keyring;

/** The seam that lets the SAME agent run in a browser without leaking keys. */
export type Transport =
  // trusted server/CLI, or browser BYOK. `headers` lets a browser set the provider's direct-access
  // opt-in; providers ALSO auto-inject their own required header (e.g. anthropic-dangerous-direct-
  // browser-access) when browserSafe. `baseUrl` targets a self-hosted / OpenAI-compatible endpoint.
  | { readonly kind: 'byok';      readonly apiKey: string; readonly baseUrl?: string; readonly headers?: HeadersInit }
  | { readonly kind: 'proxy';     readonly baseUrl: string; readonly headers?: HeadersInit }  // browser default
  | { readonly kind: 'ephemeral'; readonly baseUrl: string; readonly token: () => Promise<string> }; // vended, short-lived
```

### 3.3 Tools (Standard Schema in/out, typed DI)

```ts
import type { StandardSchemaV1 } from '@standard-schema/spec';

// Use the SPEC-provided inference, not a bespoke conditional. This closes the
// coercion/transform gap (input schemas whose Input isn't `unknown`, e.g. Zod .coerce).
type Infer<S extends StandardSchemaV1> = StandardSchemaV1.InferOutput<S>;

export interface Tool<Name extends string, In, Out, Deps> {
  readonly name: Name;
  readonly description: string;
  readonly version?: string;          // OQ-6: author-set; stamped on tool.call, diffed on durable resume
  readonly inputSchema: StandardSchemaV1<unknown, In>;
  readonly outputSchema?: StandardSchemaV1<unknown, JsonSafe<Out>>;
  /** TIER-1 HITL: suspend at the loop boundary BEFORE execute runs. No replay. */
  readonly needsApproval?: boolean | ((input: In, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  /** async generator lets a tool stream tool.progress events before returning Out.
   *  return suspend(req) to pause AFTER computing what it needs (also replay-free). */
  execute(input: In, ctx: RunContext<Deps>):
    | Promise<JsonSafe<Out> | Suspend<JsonSafe<Out>>>
    | AsyncGenerator<ToolProgress, JsonSafe<Out> | Suspend<JsonSafe<Out>>>;
}

// Variance-correct upper bound for heterogeneous tool tuples. `In` occurs in BOTH a covariant slot
// (inputSchema's output param) and contravariant slots (execute/needsApproval params), so it is
// INVARIANT — no single `Tool<string, X, unknown, Deps>` is a supertype of every concrete tool
// (the original `Tool<string, never, unknown, Deps>` required every tool's input to be `never`).
// The bound is therefore a structural shape: `never` in input positions (bottom ⇒ accepts any concrete
// input contravariantly) and `unknown`/JsonValue in output positions (top ⇒ accepts any concrete output).
// Concrete In/Out survive in the `const Tools` capture, so ToolInputOf/ToolOutputOf/narrow stay precise.
export type AnyTool<Deps> = {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  readonly inputSchema: StandardSchemaV1<unknown, unknown>;
  readonly outputSchema?: StandardSchemaV1<unknown, JsonValue>;
  readonly needsApproval?: boolean | ((input: never, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  execute(input: never, ctx: RunContext<Deps>): unknown;
};
export type ToolInputOf<T>  = T extends Tool<any, infer In,  any, any> ? In  : never;
export type ToolOutputOf<T> = T extends Tool<any, any, infer Out, any> ? Out : never;

export interface ToolProgress { readonly payload: JsonValue }

// `Out` gets a NAKED occurrence in execute's return so it is INFERABLE. (Previously it appeared only
// inside `JsonSafe<Out>` — a conditional-type position TS cannot infer through — so every tool silently
// collapsed to the `Out = string` default and any non-string tool failed to type-check.) JSON-safety is
// enforced by the `Out extends JsonValue` constraint on the factory, not by burying Out in a conditional.
interface ToolDef<Name extends string, SIn extends StandardSchemaV1, Deps, Out extends JsonValue> {
  name: Name;
  description: string;
  version?: string;                    // OQ-6 drift stamp
  inputSchema: SIn;
  outputSchema?: StandardSchemaV1<unknown, Out>;
  needsApproval?: boolean | ((input: Infer<SIn>, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  // `Out` is inferred ONLY from the bare value position; the suspend arm is NoInfer so a Tier-1b tool
  // whose sole return is `suspend(req)` doesn't infer Out = Suspend<…> (which would break Out extends
  // JsonValue). A pure-suspend tool with a NON-string resolution should annotate Out explicitly.
  execute: (input: Infer<SIn>, ctx: RunContext<Deps>)
    => Promise<Out | Suspend<NoInfer<Out>>> | AsyncGenerator<ToolProgress, Out | Suspend<NoInfer<Out>>>;
}

export interface ToolFactory<Deps> {
  <const Name extends string, SIn extends StandardSchemaV1, Out extends JsonValue = string>(
    def: ToolDef<Name, SIn, Deps, Out>,
  ): Tool<Name, Infer<SIn>, Out, Deps>;
}

/** Curried: `tool<MyDeps>()(def)` binds Deps once so `ctx.deps` is typed inside execute
 *  without re-stating Name/Schema. The no-dependency 90% calls `tool(def)` directly. */
export function tool<Deps>(): ToolFactory<Deps>;
export function tool<const Name extends string, SIn extends StandardSchemaV1, Out extends JsonValue = string>(
  def: ToolDef<Name, SIn, unknown, Out>,
): Tool<Name, Infer<SIn>, Out, unknown>;
```

**DI context — no globals:**

```ts
export interface RunContext<Deps> {
  readonly deps: Deps;              // re-injected fresh every run/resume; NEVER serialized
  readonly runId: string;
  readonly step: number;
  readonly signal: AbortSignal;     // cancellation is a web standard end-to-end
  readonly usage: Readonly<UsageTotals>;
  readonly runtime: RuntimeAdapter;
  /** push a first-class custom event into the stream */
  emit(payload: JsonValue, type?: `custom.${string}`): void;
  /** TIER-2 HITL: suspend mid-tool with a typed, validated resolution. Prefer needsApproval
   *  or `return suspend(...)` first — this is the sharp edge (see §5.2). */
  suspend<Req extends SuspensionRequest>(req: Req): Promise<ResolutionOf<Req>>;
  /** journaled, exactly-once effect. Memoized into the log; skipped on Tier-2 replay. */
  journal<T>(key: string, fn: () => Promise<T>, schema?: StandardSchemaV1<unknown, T>): Promise<T>;
}
```

### 3.4 The Agent (curried Deps binding; awaits, streams, iterates)

`Deps` and `Susp` each have exactly one honest binding site. `Deps` is fixed by the **curried factory**; `Susp` is derived from the config `suspends` array (plus the always-possible `ApprovalRequest`). Neither can silently degrade to a default while the user believes they typed it.

```ts
// NOTE: `const` type-parameter modifiers are valid only on FUNCTIONS/call signatures (they're on
// AgentFactory below), never on an interface's own type parameters — putting `const` here is a syntax
// error (caught when @mithril/core/agent was first built). The `const` capture happens at the factory call.
export interface AgentConfig<
  Tools extends readonly AnyTool<Deps>[],
  Deps,
  Out extends JsonValue,
  Susps extends readonly SuspensionRequest[],
> {
  readonly model: ModelInput;   // provider handle (self-wiring, autocompleted) OR bare 'provider/model' string
  readonly instructions: string | ((ctx: RunContext<Deps>) => string | Promise<string>); // sole system prompt
  readonly tools?: Tools;
  // `Out` is naked here (not JsonSafe<Out>) so it INFERS from the schema — same fix as tools (T2). Burying
  // it in JsonSafe<Out> made every agent's structured output collapse to `string`. JSON-safety is the
  // `Out extends JsonValue` constraint above, not a conditional in an inference position.
  readonly output?: StandardSchemaV1<unknown, Out>;   // structured output: validate → retry
  readonly maxSteps?: number;                          // default 16
  readonly outputRetries?: number;                     // validate→retry attempts, default 2
  readonly context?: ContextPolicy;                    // token budgets + compaction (§7)
  readonly prompts?: Partial<typeof DEFAULT_PROMPTS>;  // override any injected text
  /** The custom SuspensionRequests this agent may raise from ctx.suspend()/return suspend().
   *  Their element types DRIVE `Susp`, so RunResult.request and resume() are honestly typed.
   *  ApprovalRequest is always included implicitly (needsApproval can fire on any tool). */
  readonly suspends?: Susps;
  /** Producer-side composability (§3.8): plugins + middleware assembled into this agent's loop.
   *  Flattened depth-first in array order, outermost first. agentLoop (§3.6) accepts the same array. */
  readonly use?: readonly (Plugin<Deps> | Middleware<Deps>)[];
}

// ApprovalRequest AND HandoffSuspension are ALWAYS in the union — needsApproval can fire on any tool, and
// any asTool delegation can surface a HandoffSuspension. Omitting the latter re-opened S6 at the type level.
export type SuspensionOf<Susps extends readonly SuspensionRequest[]> = ApprovalRequest | HandoffSuspension | Susps[number];

export interface AgentFactory<Deps> {
  <const Tools extends readonly AnyTool<Deps>[] = [], const Out extends JsonValue = string,
   const Susps extends readonly SuspensionRequest[] = []>(
    config: AgentConfig<Tools, Deps, Out, Susps>,
  ): Agent<Tools, Deps, Out, SuspensionOf<Susps>>;
}

/** Curried for typed DI: `agent<MyDeps>()(config)` fixes Deps once and flows it to tools and RunContext
 *  without positional type args. The no-dependency 90% calls `agent(config)` directly — Deps = void, so
 *  its runs need no options object. For an app with deps, prefer `createHarness<Deps>()` (below) to bind
 *  Deps ONCE across agent/tool/plugin instead of writing `<Deps>()` at every definition. */
export function agent<Deps>(): AgentFactory<Deps>;
export function agent<
  const Tools extends readonly AnyTool<void>[] = [],
  const Out extends JsonValue = string,
  const Susps extends readonly SuspensionRequest[] = [],
>(config: AgentConfig<Tools, void, Out, Susps>): Agent<Tools, void, Out, SuspensionOf<Susps>>;

/** Bind Deps ONCE for the whole app. Returns Deps-typed `agent`/`tool`/`plugin` so no definition restates
 *  `<Deps>()`. This is the ergonomic default for any app with dependencies; the curried primitives above
 *  remain for the rare mixed-Deps module. (`agentLoop` takes its Deps from `opts.deps` directly, so it
 *  needs no binding here.) */
export function createHarness<Deps>(): {
  readonly agent: AgentFactory<Deps>;
  readonly tool: ToolFactory<Deps>;
  readonly plugin: PluginFactory<Deps>;
};

/** Durability is a discriminated input, so the signing key is required EXACTLY when a cross-store token
 *  is produced — a compile-time requirement, not a suspend-time throw. Three modes:
 *  - ephemeral: no persistence; resume only via the live RunHandle. NO token emitted.
 *  - durable-local: same-origin store (browser OPFS/IndexedDB), token stored UNSIGNED. Sound because the
 *    hostile-transport threat that HMAC defends against does not exist for same-origin storage (an
 *    attacker who can write your OPFS can already run your JS). Works in INSECURE contexts (no subtle).
 *    No at-rest integrity/confidentiality — documented, and it is the only browser-durable mode on http://.
 *  - durable: cross-store/server. Token is sealed (Keyring HMAC + optional AES-GCM codec, §5.3). Needs subtle. */
export type Persistence =
  | { readonly kind: 'ephemeral' }
  | { readonly kind: 'durable-local'; readonly checkpointer: Checkpointer }
  | { readonly kind: 'durable'; readonly checkpointer: Checkpointer; readonly keyring: Keyring; readonly codec?: SealCodec };

export interface RunOptions<Deps> {
  readonly deps: Deps;
  /** Omitted ⇒ a byok transport from the environment (ANTHROPIC_API_KEY / OPENAI_API_KEY / …). Great for
   *  dev and scripts; pass it explicitly in production. */
  readonly transport?: Transport;
  readonly persistence?: Persistence;   // omitted ⇒ { kind: 'ephemeral' }
  readonly signal?: AbortSignal;        // timeout idiom: AbortSignal.timeout(30_000)
  readonly threadId?: string;
  // ── advanced (rarely needed on the happy path) ───────────────────────────────
  /** Connects ModelId → Provider. Omitted ⇒ the default registry (meta-package auto-wires; a provider
   *  HANDLE in `model` also self-wires). Only bare-string models with no default need this. */
  readonly providers?: ProviderRegistry;
  /** resolutionSchemaId → Standard Schema for custom suspensions. Defaults to schemaRegistryFor(agent). */
  readonly schemas?: SchemaRegistry;
  readonly runtime?: RuntimeAdapter;    // omitted ⇒ defaultRuntime()
  readonly fanout?: EventTransport;     // live-tail to WS/BroadcastChannel/devtools (devtools auto-attaches, §9.2)
  /** Cross-process resume/migration channel — consumed by resume()/rehydrate(). Mirrors open()'s
   *  OpenOptions (§5.4). `depsDigest` (a caller-supplied stable dep-set tag; deps aren't serializable so
   *  it can't be derived) lives here because it only matters for cross-process continuity checks. */
  readonly resumeOptions?: {
    readonly stateVersion: string;
    readonly migrations: readonly StateMigration[];
    readonly maxBytes?: number;
    readonly depsDigest?: string;
    readonly onSchemaMissing?: (d: SuspensionDescriptor) => void; // OQ-5 → `unresumable` instead of throw
  };
}

// A no-deps agent (Deps = void) needs NO options object at all: `await assistant.run("hi")`. Any agent with
// real deps must pass `{ deps }` (and whatever else). This is what makes the 90% call site zero-ceremony.
export type RunArgs<Deps> = [Deps] extends [void] ? [opts?: RunOptions<void>] : [opts: RunOptions<Deps>];

// No 'system' role — the system prompt is `instructions` only. Assistant turns may carry tool-call/result
// parts so a fresh run per user message doesn't lose prior tool context across turns (closes A-F7).
export type InputMessage =
  | { readonly role: 'user'; readonly content: string }
  | { readonly role: 'assistant'; readonly content: string;
      readonly toolCalls?: ReadonlyArray<{ readonly callId: string; readonly name: string; readonly input: JsonValue; readonly output?: JsonValue }> };
export type Input = string | ReadonlyArray<InputMessage>;

export type RunResult<Out, Susp extends SuspensionRequest = ApprovalRequest> =
  | { readonly status: 'completed'; readonly output: Out; readonly usage: UsageTotals; readonly state: SerializedRunState }
  // Pure data — no inline resume closure. token is a sealed blob under durable, an unsigned blob under
  // durable-local, null under ephemeral. Resume ⇒ agent.resume/rehydrate(token, ...).
  | { readonly status: 'suspended'; readonly request: Susp; readonly token: SerializedRunState | null }
  // OQ-5: a durable token that cannot be resumed (schema id removed, or migration gap) degrades HERE
  // instead of throwing — carries the original request so the caller can route it, not a crash.
  | { readonly status: 'unresumable'; readonly request: SuspensionRequest; readonly reason: 'schema-missing' | 'migration-gap' | 'tool-drift' }
  | { readonly status: 'cancelled'; readonly usage: UsageTotals }
  | { readonly status: 'error';     readonly error: SerializedError; readonly usage: UsageTotals };

export interface Agent<Tools extends readonly AnyTool<Deps>[], Deps, Out, Susp extends SuspensionRequest> {
  // 90%: await. Suspension is an unignorable discriminated branch.
  // opts is OPTIONAL when the agent has no deps (Deps = void) → `await agent.run("hi")`. See RunArgs.
  run(input: Input, ...opts: RunArgs<Deps>): Promise<RunResult<Out, Susp>>;
  // three-tier stream off one handle.
  stream(input: Input, ...opts: RunArgs<Deps>): RunHandle<Out, Susp>;
  // 10%: step-level pause / mutate / inject.
  iterate(input: Input, ...opts: RunArgs<Deps>): AsyncGenerator<StepController<Deps>, RunResult<Out, Susp>>;
  // HEADLESS cross-process resume: open the token, apply the resolution, run to the next stop. deps +
  // tools + instructions are re-provided by reconstructing the SAME agent(config) via opts; NOTHING is
  // deserialized into behavior. Migration/keyring/onSchemaMissing travel on opts (persistence + resumeOptions).
  resume(token: SerializedRunState, resolution: ResolutionOf<Susp>, opts: RunOptions<Deps>): Promise<RunResult<Out, Susp>>;
  // STREAMED cross-process resume: rehydrate a suspended token into a LIVE RunHandle positioned AT the
  // pending suspension. It re-emits the recorded log (so useRun/useApproval attach and render the
  // pending approval) BEFORE the human decides; calling handle.resolve(resolution) streams the
  // continuation on the same broadcast. This is the seam open() feeds — no dead-end. (Closes A-M1/M2.)
  rehydrate(token: SerializedRunState, opts: RunOptions<Deps>): Promise<RunHandle<Out, Susp>>;
  // delegation = handoff-as-synthetic-tool, zero tool redefinition (graft: P1).
  // The sub-agent runs UNDER the parent RunContext: deps, transport, runtime and signal are inherited,
  // so parent Deps must be assignable to child Deps. A child suspension does NOT leak the child's Susp
  // union into the parent's generics: it surfaces to the parent as a built-in HandoffSuspension whose
  // payload carries the child descriptor, and resolving it forwards (schema-validated) to the child.
  // So the parent stays closed over `HandoffSuspension` regardless of child suspensions (closes D-B8).
  // Delegation input defaults to { task: string }; pass an `input` schema for structured handoffs.
  asTool<N extends string, In = { readonly task: string }>(
    o: { name: N; description: string; input?: StandardSchemaV1<unknown, In> },
  ): Tool<N, In, JsonSafe<Out>, Deps>;
  readonly __tools?: Tools; // phantom carrier for InferUITools; erased at build
  readonly __susp?: Susp;   // phantom carrier for useApproval typing; erased at build
}
```

### 3.5 Three-tier streaming (one canonical source, explicit backpressure)

All tiers are tee'd from **one broadcast** so `seq` never desyncs across representations. Backpressure is a **two-class** policy, stated rather than emergent:

- **The durable/log tee is lossless** and applies backpressure to the loop (and thus the provider read). It is the source of truth for `state()`/`result()`/checkpointing.
- **Live-tail/fanout tees (`events`/`text`/`raw` consumers, every `fanout` EventTransport) are lossy and bounded** by a ring buffer. On overflow they emit a gap marker; consumers re-sync via `assertContiguous` + `subscribe(onEvent, resumeFrom)`. This prevents one slow browser tab or bad WebSocket from either stalling the model stream to an idle-timeout or forcing unbounded buffering (OOM). Ring size and the provider-idle-timeout interaction are configurable and documented.

```ts
export interface RunHandle<Out, Susp extends SuspensionRequest> extends AsyncIterable<MithrilEvent> {
  readonly runId: string;                     // available synchronously — locate the checkpoint without draining events
  readonly events: AsyncIterable<MithrilEvent> & { toReadable(): ReadableStream<MithrilEvent> }; // typed tier (lossy tail)
  readonly text: AsyncIterable<string>;      // pretty tier = filter(text.delta)
  readonly raw: AsyncIterable<JsonValue>;     // raw provider passthrough — best-effort, NOT replayed
  state(): RunState;                          // = replay(lossless log)
  result(): Promise<RunResult<Out, Susp>>;
  /** In-process continuation of a suspended STREAMED run on the SAME broadcast, so
   *  useRun/useApproval stay attached across the suspension. Validated against the
   *  pending descriptor's schema before it is applied. This is the in-process counterpart
   *  to agent.resume(token, ...) (which is for cross-process HITL). */
  resolve(resolution: ResolutionOf<Susp>): void;
  cancel(reason?: string): void;
}

export interface StepController<Deps> {
  readonly step: number;
  readonly state: RunState;
  inject(message: Input): void;      // splice a message before the next model call
  setInstructions(s: string): void;
  abort(reason?: string): void;
}
```

### 3.6 The tier-0 escape hatch (graft: P1)

```ts
/** The ~100 readable lines a dev could copy out. Emits the byte-identical MithrilEvent stream
 *  as agent(). Ejection is one import down, never a rewrite. Tools defined here are the exact
 *  same Tools the Agent consumes (layered ramp, no redefinition). */
export function agentLoop<Deps>(opts: {
  readonly model: ModelInput;
  readonly transport: Transport;
  readonly providers?: ProviderRegistry;   // optional if `model` is a self-wiring handle; explicit otherwise
  readonly instructions: string;
  readonly tools: readonly AnyTool<Deps>[];
  readonly messages: Input;
  readonly deps: Deps;
  readonly runtime?: RuntimeAdapter;
  readonly signal?: AbortSignal;
  readonly use?: readonly (Plugin<Deps> | Middleware<Deps>)[]; // same composability array as ag() — ejection keeps your bricks
}): AsyncGenerator<MithrilEvent, RunResult<string>>;

/** All injected text, named and overridable. No hidden prompts. */
export declare const DEFAULT_PROMPTS: {
  readonly toolRetry: string;
  readonly structuredRetry: string;
  readonly compaction: string;
  readonly handoff: string;
};
```

### 3.7 Inference to the UI (local, bounded)

```ts
// InferUITools recovers ONLY input types (output threading is deliberately dropped to cap tsc depth).
export type InferUITools<A> =
  A extends Agent<infer T, any, any, any>
    ? { [E in T[number] as E extends Tool<infer N, any, any, any> ? N : never]:
          { input: ToolInputOf<E> } }
    : never;

// Recover the agent's suspension union for typed HITL affordances.
export type InferSuspension<A> = A extends Agent<any, any, any, infer S> ? S : never;
```

---

### 3.8 Composability layer — Middleware & Plugins (decided: both in v1)

The protocol already makes *consumers* composable (anything can read `MithrilEvent`s without importing the loop). This section adds the missing *producer-side* composability so Mithril is a set of lego bricks, not a monolith. Two concepts, both in v1.

**Design law that keeps it composable:** middleware has **no private side channel**. It observes and transforms only by reading and emitting `MithrilEvent`s through the same single-`seq` ordering authority (§ OQ-3 decision). There is no second, hidden control plane — so everything middleware does stays replayable, inspectable in devtools. A middleware that "does something" but emits nothing is, by construction, invisible and therefore illegal-by-review.

```ts
// The payload types the middleware altitudes carry (all in /protocol, all JSON-safe on the wire slots).
export interface ModelCall {
  readonly model: ModelId;
  readonly system: string;
  readonly messages: RunState['messages'];
  readonly tools: readonly AnyTool<unknown>[];   // the tools offered to the model THIS step (post tool-search)
}
export interface ModelResult { readonly text: string; readonly finishReason: FinishReason; readonly usage: UsageDelta }
export interface ToolInvocation { readonly callId: string; readonly name: string; readonly input: JsonValue; readonly version?: string }
export type ToolOutcome =
  | { readonly callId: string; readonly status: 'ok';    readonly output: JsonValue }
  | { readonly callId: string; readonly status: 'error'; readonly error: SerializedError };
export interface StepOutcome { readonly stop: 'tool' | 'text' | 'output' }

// Onion model (outermost first), à la Hono/koa. Implement only the altitudes you need.
export interface Middleware<Deps = unknown> {
  readonly name: string;                     // unique; shown in devtools + span attribution
  step?:  (ctx: MiddlewareContext<Deps>, next: () => Promise<StepOutcome>) => Promise<StepOutcome>;
  model?: (ctx: MiddlewareContext<Deps>, call: ModelCall, next: (c: ModelCall) => Promise<ModelResult>) => Promise<ModelResult>;
  tool?:  (ctx: MiddlewareContext<Deps>, call: ToolInvocation, next: (c: ToolInvocation) => Promise<ToolOutcome>) => Promise<ToolOutcome>;
  /** RESUME-time altitude (OQ-6): fires when a durable resume completes a pending tool call whose stamped
   *  `version` differs from the redeployed tool. Return 'proceed' to run anyway, or 'unresumable' to
   *  degrade the run gracefully (§3.4 RunResult). This is where toolVersioningMiddleware lives. */
  onToolDrift?: (ctx: MiddlewareContext<Deps>, drift: { readonly name: string; readonly recorded?: string; readonly current?: string }) => 'proceed' | 'unresumable';
}

// Read/adjust the token budget (§7). `setLimit` is the sanctioned mutation surface (compaction uses it).
export interface ContextBudget {
  readonly limit: number;
  readonly used: number;
  estimate(messages: RunState['messages']): number;
  setLimit(next: number): void;
}

// An event a middleware emits; the loop stamps EventMeta (v/runId/seq/span/ts) — the caller never owns seq.
export type DraftEvent =
  | { readonly type: `custom.${string}`; readonly payload: JsonValue }
  | { readonly type: 'compaction'; readonly removedSeqRange: readonly [number, number]; readonly savedTokens: number };

export interface MiddlewareContext<Deps> {
  readonly deps: Deps;                        // same typed DI as tools; re-injected per run/resume
  readonly runId: string;
  readonly step: number;
  readonly signal: AbortSignal;
  readonly usage: Readonly<UsageTotals>;      // budget decisions can read spend-so-far
  readonly runtime: RuntimeAdapter;           // now(), randomUUID(), fetch — replay-deterministic
  readonly budget: ContextBudget;             // read/adjust token budget (§7)
  /** Journaled, exactly-once effect keyed in the log — the SANCTIONED store for a caching/effectful
   *  middleware (modelCacheMiddleware et al). This is why "no private side channel" (below) doesn't
   *  forbid caching: the cache lives in the replayable journal, not a hidden closure Map. */
  journal<T>(key: string, fn: () => Promise<T>, schema?: StandardSchemaV1<unknown, T>): Promise<T>;
  emit(event: DraftEvent): void;              // stamped with seq/span/trace by the loop, not the caller
}
```

`next` is the continuation; a middleware may short-circuit (return without calling `next` — e.g. a cache hit or a guardrail block) or transform the call/result on the way through. Composition is array order, outermost first, deterministic. Middleware is replay-correct for free because of how replay works (§8): **replay re-emits the recorded log and runs no loop, so middleware never fires and no side effect can re-run.** `ctx.journal` is what makes the *record* path (and watch-mode re-record) deterministic — an effectful middleware's I/O is memoized into the log so a re-record reads it back instead of re-hitting the world.

```ts
// Pure MithrilEvent subscriber contributed by a plugin (retrieval loggers, custom meters, exporters).
export interface EventConsumer { readonly name: string; onEvent(e: MithrilEvent): void }
// setup() lifecycle handle: register additional fragments or read resolved config. Idempotent (may run on rehydrate).
export interface PluginHost { register<Deps>(fragment: Partial<Plugin<Deps>>): void }

// A plugin is a bundle of bricks registered through ONE call. Generic over `const Tools` (with a phantom
// carrier, mirroring Agent) so plugin tool types SURVIVE for InferPluginTools instead of widening to AnyTool.
// `const` is applied at the plugin() call signature below, NOT here — it's invalid on an interface type
// parameter (caught when @mithril/core built).
export interface Plugin<Deps = unknown, Tools extends readonly AnyTool<Deps>[] = readonly AnyTool<Deps>[]> {
  readonly name: string;
  readonly tools?:      Tools;
  readonly middleware?: readonly Middleware<Deps>[];
  readonly providers?:  readonly Provider[];        // contributes to the providerRegistry
  readonly consumers?:  readonly EventConsumer[];   // pure MithrilEvent subscribers (OTel/devtools-shaped)
  readonly setup?:      (host: PluginHost) => void | Promise<void>;  // idempotent, replay-safe
  readonly __tools?: Tools;                          // phantom carrier; erased at build
}
// Curried like agent/tool (§13): `plugin<Deps>()(p)` fixes Deps WITHOUT collapsing the `const Tools`
// capture (positional `<Deps, Tools>` would force Tools to its default and break InferPluginTools). The
// no-deps 90% calls `plugin(p)` directly.
export interface PluginFactory<Deps> {
  <const Tools extends readonly AnyTool<Deps>[] = []>(p: Plugin<Deps, Tools>): Plugin<Deps, Tools>;
}
export function plugin<Deps>(): PluginFactory<Deps>;
export function plugin<const Tools extends readonly AnyTool<unknown>[] = []>(p: Plugin<unknown, Tools>): Plugin<unknown, Tools>;

// Recover a plugin's tool input types locally, on demand (parallels InferUITools; §3.7). Unwraps a plugin
// FACTORY too, so `InferPluginTools<typeof ragPlugin>` works whether ragPlugin is a Plugin or `() => Plugin`.
export type InferPluginTools<P> =
  P extends (...args: readonly any[]) => infer R ? InferPluginTools<R> :
  P extends Plugin<any, infer T>
    ? { [E in T[number] as E extends Tool<infer N, any, any, any> ? N : never]: { input: ToolInputOf<E> } }
    : never;

// Registration site: the agent config gains one field.
agent<Deps>()({
  model: "anthropic/claude-fable-5",
  instructions: "...",
  tools: [ /* inline tools flow to InferUITools */ ],
  use: [ anthropicPlugin(), ragPlugin(), guardrailsPlugin(), compactionMiddleware() ], // (Plugin | Middleware)[]
});
```

**Flatten order.** `use` is flattened depth-first in array order, outermost first: a plugin's own `middleware[]` interleaves at the plugin's position, so `use: [pluginA, mwB]` yields `pluginA.middleware…, mwB` around the core loop. Deterministic and documented.

**Type boundary (deliberate, to protect the tsc budget).** Inline `tools` are what flow statically to `InferUITools`/`narrow()` on the *agent*. Plugin-contributed tools are merged into the **runtime** tool registry and are fully callable; their static input types are recovered locally and on demand via `InferPluginTools<typeof ragPlugin>` (now real — `plugin` captures a `const` tuple) rather than being unioned into the agent's global tool type. This keeps plugin authorship from inflating every consumer's instantiation depth — the monomorphic-wire discipline (Principle #3) applied to the plugin seam. A CI fixture stacks 20 plugins to hold the line.

**Bricks this immediately yields (several are the OQ resolutions):**
- `toolVersioningMiddleware()` — stamps tool version on pending calls, routes drift to `onToolDrift` (**OQ-6**).
- `rawSidecar()` — opt-in raw-provider-bytes consumer, capped + redacted, outside semantic replay (**OQ-4**).
- `compactionMiddleware()` / `tokenBudgetMiddleware()` / `toolSearchMiddleware()` — context-engineering (§7) as attachable bricks, not core hardwiring.
- `guardrailMiddleware()`, `retryMiddleware()`, `modelCacheMiddleware()`, `fallbackModelMiddleware()` — the everyday extension points, none of which require forking `agentLoop`.

Ejection is preserved: `agentLoop` (§3.6) accepts the same `use` array, so dropping to the tier-0 readable loop keeps your plugins.

---

## 4. The event protocol — full discriminated union

`@mithril/core/protocol`. **Monomorphic** (`input`/`output` are `JsonValue`) so the global union never indexes over a tool record — the structural defense against type-instantiation collapse. Every event is JSON-safe and structured-clone-safe.

```ts
export interface EventMeta {
  readonly v: 1;             // protocol MAJOR; the migrate() codec keys off this
  readonly runId: string;
  readonly seq: number;      // monotonic, gap-free per run → ordering + replay cursor + gap detection
  readonly ts: number;       // runtime.now() epoch ms (number, not Date, to stay clone-safe)
  readonly span: SpanRef;    // OTel gen_ai hierarchy carried on EVERY event
}

export interface SpanRef {
  readonly id: string;
  readonly parentId: string | null;
  readonly traceId: string;  // graft P2: full W3C linkage, not just kind
  readonly kind: 'invoke_agent' | 'chat' | 'execute_tool' | 'workflow' | 'handoff';
}

export type MithrilEvent =
  // ── lifecycle (spans open/close here) ─────────────────────────────
  | (EventMeta & { type: 'run.start';   input: JsonValue; model: string; depsDigest: string })
  | (EventMeta & { type: 'run.finish';  reason: FinishReason; usage: UsageTotals })
  | (EventMeta & { type: 'run.error';   error: SerializedError })
  | (EventMeta & { type: 'run.cancel';  reason: string })
  | (EventMeta & { type: 'step.start';  step: number })                        // opens a `chat` span
  | (EventMeta & { type: 'step.finish'; step: number; stop: 'tool' | 'text' | 'output'; usage: UsageDelta })

  // ── assistant message body (streaming) ────────────────────────────
  | (EventMeta & { type: 'text.delta';        delta: string })
  | (EventMeta & { type: 'reasoning.delta';   delta: string })                 // capability-flagged
  | (EventMeta & { type: 'tool.input.delta';  callId: string; name: string; partial: string }) // partial JSON
  | (EventMeta & { type: 'tool.call';         callId: string; name: string; input: JsonValue; version?: string }) // opens `execute_tool`; version stamped for OQ-6 drift
  | (EventMeta & { type: 'tool.progress';     callId: string; payload: JsonValue })
  | (EventMeta & { type: 'tool.result';       callId: string; output: JsonValue; ms: number })
  | (EventMeta & { type: 'tool.error';        callId: string; error: SerializedError })
  | (EventMeta & { type: 'message.end';       role: 'assistant'; usage: UsageDelta })

  // ── structured output: validate → retry, every attempt on the record ─
  | (EventMeta & { type: 'object.delta';   partial: JsonValue })
  | (EventMeta & { type: 'object.invalid'; attempt: number; issues: JsonValue })
  | (EventMeta & { type: 'object.final';   value: JsonValue })

  // ── accounting / context economics (devtools meters read straight off these) ─
  | (EventMeta & { type: 'usage';       delta: UsageDelta })
  | (EventMeta & { type: 'compaction';  removedSeqRange: readonly [number, number]; summarySeq: number; savedTokens: number })

  // ── control flow ──────────────────────────────────────────────────
  // handoff carries the SAME callId as its synthetic tool.call so parent↔sub-run pairing is carried,
  // not reconstructed (§9.3); handoff.result closes it. The sub-run's own events ride their own span
  // (span.kind==='invoke_agent', parentId = this handoff's span) and are routed by the reducer below.
  | (EventMeta & { type: 'handoff';        callId: string; to: string; input: JsonValue })  // opens an `invoke_agent` sub-span
  | (EventMeta & { type: 'handoff.result'; callId: string; to: string; output: JsonValue }) // closes it
  | (EventMeta & { type: 'tool.approval.requested'; callId: string; name: string; input: JsonValue; version?: string }) // TIER-1 HITL
  | (EventMeta & { type: 'suspend';  descriptor: SuspensionDescriptor })
  | (EventMeta & { type: 'resume';    resolutionFor: string; value: JsonValue })

  // ── escape hatch ──────────────────────────────────────────────────
  | (EventMeta & { type: `custom.${string}`; payload: JsonValue });

export type EventType = MithrilEvent['type'];
export type EventOf<T extends EventType> = Extract<MithrilEvent, { type: T }>;

// Address a SPECIFIC custom id (Extract over `custom.${string}` yields never for a literal).
export type CustomEventOf<Id extends string, P extends JsonValue = JsonValue> =
  EventMeta & { type: `custom.${Id}`; payload: P };
```

### 4.1 Pure consumers (all total, all in `/protocol`)

```ts
// ── reducer / time-travel ──────────────────────────────────────────
export interface RunState {
  readonly runId: string;
  readonly status: 'running' | 'suspended' | 'unresumable' | 'completed' | 'cancelled' | 'error';
  readonly messages: ReadonlyArray<{
    readonly role: string; readonly content: string;
    readonly toolCalls: ReadonlyArray<{ callId: string; name: string; input: JsonValue; output?: JsonValue }>;
  }>;
  readonly usage: UsageTotals;
  readonly cursor: number;              // last applied seq
  readonly pending?: SuspensionDescriptor;
  /** Sub-run state keyed by sub-span id. reduce() routes each event by `span` so a sub-agent's
   *  run.finish/usage/message.end accrue HERE, not into the root — the root projects only its own
   *  span (closes D-F9, the span-blind-reducer corruption). Root usage rolls up sub-run usage. */
  readonly subruns?: Readonly<Record<string, RunState>>;
}
export declare const INITIAL: RunState;
// Total by construction: an unrecognized `type` (a future additive member) is folded as an inert no-op,
// never throws (makes additive union growth a MINOR, §4.2). Span-routed: an event whose span is a
// sub-run folds into state.subruns[spanId]; root fields see only root-span events.
export function reduce(state: RunState, e: MithrilEvent): RunState;
export function replay(log: readonly MithrilEvent[], toSeq?: number): RunState;  // time-travel = fold to cursor (root projection)
// NOTE: `status: 'unresumable'` is the ONE status NOT produced by reduce(). It is environment-relative (a
// schema id was removed, a tool drifted) so it cannot be reconstructed from the log alone — it is set by
// resume()/open() at resume time, not folded. All other statuses are pure functions of the log.

// ── opt-in LOCAL typed narrowing (never in the wire union) ──────────
// ToolNameOf is DISTRIBUTIVE (T is a naked param); the final index MUST use it, not a bare
// `Tools[number] extends Tool<…>` (non-distributive → collapses the whole type to `never`; caught when
// @mithril/core/protocol was first type-checked).
type ToolNameOf<T> = T extends Tool<infer N, infer _In, infer _O, infer _D> ? N : never;
export type ToolCallFor<Tools extends readonly AnyTool<unknown>[]> = {
  [T in Tools[number] as ToolNameOf<T> & string]:
    T extends Tool<infer N, infer In, infer _O, infer _D>
      ? { readonly callId: string; readonly name: N; readonly input: In }
      : never;
}[ToolNameOf<Tools[number]> & string];

// TYPE PREDICATE — delivers real, name-correlated narrowing (was a type-level no-op).
export function narrow<const Tools extends readonly AnyTool<any>[]>(
  e: MithrilEvent, tools: Tools,
): e is EventOf<'tool.call'> & ToolCallFor<Tools>;

// ── gap-detecting cross-runtime transport (web standards only) ──────
export interface EventTransport {
  publish(e: MithrilEvent): void;
  subscribe(onEvent: (e: MithrilEvent) => void, resumeFrom?: number): () => void; // catch up gap-free from a cursor
}
export function inMemoryTransport(): EventTransport;
// Node/Bun: the channel is .unref()'d so a one-shot `bunx` process is not held open.
// workerd omitted (no BroadcastChannel) — use durableObjectTransport there.
export function broadcastChannelTransport(name: string): EventTransport;
// resumeFrom gap-free catch-up REQUIRES a server-side seq-indexed log to replay from; with a bare
// client socket it is best-effort/lossy and says so. On workerd, pair with durableObjectTransport.
export function webSocketTransport(url: string | WebSocket): EventTransport;
export function durableObjectTransport(stub: unknown): EventTransport; // workerd-native: DO + WebSocketPair, seq-indexed
export function assertContiguous(prev: number, e: MithrilEvent):
  | { readonly ok: true }
  | { readonly ok: false; readonly missingFrom: number };

// ── protocol migration codec (shipped in v1) ─
export function migrate(event: JsonValue): MithrilEvent; // forward-only; refuses unknown majors
```

**Ordering authority:** one monotonic `seq` counter per run. Parallel tool-call emissions are serialized through it — the price for deterministic replay and trivial gap detection. (True wall-clock concurrency is recoverable via `ts` + `span.kind`.) See Open Question OQ-3 on the fan-out throughput ceiling.

### 4.2 Union evolution contract (resolves the exhaustiveness blast radius)

`MithrilEvent` is a **declared non-exhaustively-matchable union.** This is a supported, documented contract, not an accident:

- Consumers **must** provide a catch-all (`default`/`custom.*`) branch. `reduce` is total by construction (§4.1) and treats unknown `type` as inert.
- `assertKnownEvent(e)` is exported as a **tolerant** guard that narrows known members but does **not** `assertNever` on unknown ones — so evolving the union does not compile-break downstream `switch`es.
- Under this contract, **adding an event member is a MINOR release.** Removing or changing the shape of an existing member is a MAJOR. This is the single largest semver surface in the design and it is now explicitly owned here rather than left to each consumer's `assertNever` default. (See OQ-10 for the additive-only proof obligation before 1.0.0.)

---

## 5. Suspension / HITL model

Suspension is a **first-class value and event**, never a thrown `interrupt()`. The resume path rebuilds state by `replay(log)` — a total pure fold — so **prior model calls are never re-executed** and hostile ordering can at worst produce well-typed nonsense state, never code execution.

**Reachability (closes the "SchemaRegistry unreachable" blocker).** Every custom suspension is reachable from the public surface: the agent declares its `suspends` array (§3.4) which drives `Susp`; `schemaRegistryFor(agent)` (§5.2) derives the `SchemaRegistry` from that array; and `RunOptions.schemas` / `open()`'s `schemas` carry it. The built-in `ApprovalRequest` schema is always registered. There is no suspension the runtime can raise that the consumer cannot register a validator for.

**Delegation note.** `asTool` sub-agents run under the parent `RunContext`: `deps`, `transport`, `runtime`, and `signal` are inherited from the parent run, so parent `Deps` must be assignable to child `Deps`. A sub-agent needing wider deps is a type error at `asTool`, not a silent handoff-time failure.

### 5.1 Type-level representation

```ts
export interface SuspensionRequest<Kind extends string = string, Payload extends JsonValue = JsonValue, Resolution = JsonValue> {
  readonly kind: Kind;
  readonly payload: Payload;                                        // shown to human/UI, JSON-safe (enforced)
  readonly resolutionSchema: StandardSchemaV1<unknown, Resolution>; // resume input is VALIDATED, not trusted
  readonly resolutionSchemaId: string;                             // registry id — how open()/schemas resolve the validator
}
export type ResolutionOf<R> = R extends SuspensionRequest<any, any, infer T> ? T : never;

// Canonical built-in (the 90% HITL case):
export type ApprovalRequest = SuspensionRequest<
  'tool.approval',
  { readonly name: string; readonly input: JsonValue },
  ApprovalDecision<JsonValue>
>;
export type ApprovalDecision<I> =
  | { readonly kind: 'approve' }
  | { readonly kind: 'reject'; readonly message: string }
  | { readonly kind: 'edit'; readonly input: I };  // edit args, then run (graft: P3 Tier-1)

// Built-in: a sub-agent (asTool, §3.4) suspended. The parent sees THIS regardless of the child's own
// Susp union — so child suspensions never leak into the parent's generics. `resolution` is forwarded
// down to the child's pending suspension and validated by the CHILD's schema before it resumes.
export type HandoffSuspension = SuspensionRequest<
  'handoff.suspended',
  { readonly to: string; readonly child: SuspensionDescriptor },
  JsonValue  // opaque here; the child's resolutionSchemaId (carried in `child`) validates it on forward
>;
// ApprovalRequest AND HandoffSuspension are always implicitly in every agent's Susp union.

// The Suspend marker returned from execute (replay-free mid-tool pause). `Out` is the type of
// the resolution that will be fed back as the tool result, tying execute's return to the resume value.
export declare const SUSPEND: unique symbol;
export interface Suspend<Out> { readonly [SUSPEND]: true; readonly __out?: Out; readonly request: SuspensionRequest }
export function suspend<Req extends SuspensionRequest>(req: Req): Suspend<ResolutionOf<Req>>;

// A serializable, UI-facing view of what a run is waiting on:
// A `type` (not `interface`) so it gains TS's implicit index signature and is assignable to JsonValue —
// HandoffSuspension embeds it as a payload (caught when @mithril/core/protocol was first type-checked).
export type SuspensionDescriptor = {
  readonly kind: string;
  readonly callId?: string;
  readonly payload: JsonValue;
  readonly resolutionSchemaId: string; // registry id → the Standard Schema used to validate the resolution
  readonly toolVersion?: string;       // OQ-6: the pending tool's stamped version, checked on resume for drift
};
```

`agent<Deps>()({ ..., suspends })` derives the union of interrupt kinds it can raise (`SuspensionOf<Susps>`), so `resume(token, resolution, opts)` type-checks the resolution against exactly the pending kinds, and the `'suspended'` branch of `RunResult` is unignorable — for custom suspensions, not just approvals.

### 5.2 The three HITL mechanisms (two replay-free, one advanced)

| Tier | Trigger | When it pauses | Replay? | Use for |
|---|---|---|---|---|
| **1** | `tool.needsApproval` | **before** `execute` runs | none — execute never ran | ~90%: approve/reject/edit a tool call |
| **1b** | `return suspend(req)` from `execute` | at execute **return** | none — execute already returned; resolution is fed as the tool result | single-shot "compute, then wait for a human answer" |
| **2** | `await ctx.suspend(req)` mid-`execute` | mid-function | execute re-runs on resume; `ctx.journal(key, fn)` memoizes prior effects for side-effect-free replay | genuine multi-stage human input inside one tool |

Tier 2 is the sharp edge and is documented as such: an ESLint rule (`mithril/effects-in-journal`) plus a runtime nondeterminism detector guard it, but the type system cannot enforce "all effects go through `ctx.journal`" — a deliberately accepted limit (§13). Tiers 1 and 1b cover the overwhelming majority and are structurally replay-free.

**Registry helper:**

```ts
export interface SchemaRegistry {
  get(id: string): StandardSchemaV1<unknown, JsonValue> | undefined;
  readonly ids: readonly string[];
}
export function schemaRegistry(entries: Readonly<Record<string, StandardSchemaV1<unknown, JsonValue>>>): SchemaRegistry;
// Derive the registry from an agent's declared `suspends` PLUS the built-in ApprovalRequest and
// HandoffSuspension, AND — transitively — the `suspends` of every sub-agent reachable through an `asTool`
// on this agent's tools. Without the transitive walk, cross-process resume of a delegated CUSTOM child
// suspension would hit a missing schema id and spuriously degrade to `unresumable` (susp-N6). `asTool`
// therefore stamps its child's schema ids onto the returned handoff tool so this walk can find them.
export function schemaRegistryFor(agent: Agent<any, any, any, any>): SchemaRegistry;
```

### 5.3 Serialization format

The suspended run serializes as the **event log** (or a snapshot seq + tail) plus a pending descriptor and an HMAC digest — never ad-hoc state, never `deps`, tool functions, DB handles, or the instructions closure. A sealed token exists **only under `persistence.kind === 'durable'`**; ephemeral runs never emit a token and are resumed only via the live `RunHandle.resolve`.

```ts
export type SerializedRunState = string & { readonly __brand: 'mithril.runstate.v1' };

interface RunStateWireV1 {
  readonly v: 1;                     // formatVersion (runtime-owned wire shape)
  readonly stateVersion: string;     // `${number}.${number}.${number}` — author's suspension/tool contract
  readonly runId: string;
  readonly log: readonly MithrilEvent[]; // or { snapshotSeq, tail } for large runs
  readonly cursor: number;
  readonly pending: SuspensionDescriptor;
}

// THREE-part envelope `header.payload.digest` (S2 fix). The header carries the routing metadata that
// MUST be readable BEFORE verification — the signing `kid` and the `codec` — and is itself authenticated:
//   header  = base64url(utf8Bytes(JSON({ v: 1, kid, codec, ekid? })))   // kid = signing key; ekid = AES-GCM key (rotatable)
//   payload = base64url(codec.encode(utf8Bytes(JSON(body))))   // hmac: identity; aesgcm: ciphertext+iv
//   digest  = base64url(HMAC-SHA256(key, utf8Bytes(header + "." + payload)))   // signs header AND payload
// Signing the exact transmitted `header + "." + payload` bytes means kid/codec are tamper-evident
// (no kid-substitution or codec-downgrade) AND verification never parses hostile bytes first (§5.4).
export interface SealCodec {
  readonly id: 'hmac' | 'aesgcm' | (string & {});
  encode(plaintextBytes: Uint8Array, rt: RuntimeAdapter): Promise<Uint8Array>; // hmac: identity; aesgcm: encrypt
  decode(encodedBytes: Uint8Array, rt: RuntimeAdapter): Promise<Uint8Array>;
}
export function hmacCodec(): SealCodec;                 // integrity only (default) — no confidentiality
export function aesGcmCodec(key: CryptoKey): SealCodec; // OQ-2: at-rest confidentiality for PII in checkpoints

// Sealed (cross-store) write path. Header records BOTH the signing `kid` (keyring.current()) and, when a
// confidentiality codec is used, an `ekid` so the AES-GCM key can rotate without stranding old tokens.
export function seal(body: RunStateWireV1, keyring: Keyring, rt: RuntimeAdapter, codec?: SealCodec): Promise<SerializedRunState>;
// UNSIGNED (durable-local) write path — same-origin OPFS, runs with NO subtle. This is the one serializer
// that must work in an insecure context; exported (not loop-private) so it is testable. Produces a
// single-segment token that open({trust:'local'}) accepts and open({trust:'sealed'}) REFUSES.
export function sealLocal(body: RunStateWireV1, rt: RuntimeAdapter): Promise<SerializedRunState>;
```

**Resumable cross-store runs REQUIRE `persistence.kind === 'durable'`** (Keyring + optional AES-GCM codec) — the keyring is a structural, compile-time requirement of that branch, not an optional field that throws at suspend time. `durable-local` stores an **unsigned** token (same-origin OPFS; sound because the hostile-transport threat is absent there) and works in insecure contexts. Zero-config `ephemeral` never persists a token and is resumable **only** in-process via `RunHandle.resolve`. There is no "disable integrity" flag on the `durable` (cross-store) path — the LangGraph checkpointer RCE class is not worth a frictionless cross-store token.

### 5.4 Hardened resume — the `open()` trust boundary (graft: P3)

`open()` is the single trust boundary. Ordered, never-trust-before-verify:

```ts
export type OpenResult =
  | { readonly ok: true; readonly body: RunStateWireV1 }
  // OQ-5: verification passed but the run cannot continue (resolutionSchemaId gone, migration gap). This
  // is DATA the caller (resume/rehydrate) turns into an `unresumable` RunResult — not a thrown crash.
  | { readonly ok: false; readonly reason: 'schema-missing' | 'migration-gap'; readonly pending: SuspensionDescriptor };

// `trust` is EXPLICIT, never inferred from token shape — the caller states which store the token came from,
// so an attacker who strips `header.…digest` down to one segment cannot downgrade a sealed store to
// unsigned (the signature-stripping attack). Sealed REQUIRES a keyring at compile time; local forbids one.
export type OpenOptions =
  & { readonly runtime: RuntimeAdapter; readonly formatVersion: 1; readonly stateVersion: string
    ; readonly migrations: readonly StateMigration[]; readonly schemas: SchemaRegistry; readonly maxBytes?: number }
  & ( { readonly trust: 'sealed'; readonly keyring: Keyring; readonly decrypt?: SealCodec } // decrypt REQUIRED iff header.codec !== 'hmac'
    | { readonly trust: 'local' } );                                                        // same-origin unsigned; no keyring, no subtle
export function open(token: string, opts: OpenOptions): Promise<OpenResult>;
```

**Sealed path** (`trust: 'sealed'`, `runtime.subtle` REQUIRED — loud error if absent):
1. **Length cap** — reject `> maxBytes` before any work (DoS guard). Reject any token that is not a 3-part `header.payload.digest` envelope — a stripped/unsigned token in sealed mode is an integrity error, never a silent downgrade. *(Integrity errors ⇒ throw `StateIntegrityError`; the `OpenResult.ok:false` branch is reserved for VERIFIED-but-unresumable, so a forged token can never masquerade as graceful degradation.)*
2. **Parse ONLY the unauthenticated header** (`kid`, `codec`, `ekid?`) — a bounded, fixed-shape JSON read, prototype-stripped, used solely to select the verify key via `keyring.resolve(kid)`. No `payload`/`body` bytes decoded yet.
3. **Constant-time HMAC verify over the RAW transmitted `header + "." + payload` bytes** via `subtle.verify('HMAC', ...)` — mismatch ⇒ `StateIntegrityError`. The signature covers those exact bytes, so kid/codec are authenticated and nothing hostile is parsed pre-verify.
4. **base64url-decode the payload → `decrypt.decode` (hmac: identity; aesgcm: decrypt with the `ekid`-selected key) → `JSON.parse` with a reviver dropping `__proto__`/`prototype`/`constructor`.** (Decode order is the exact inverse of `seal`'s `base64url(codec.encode(bytes))`: un-base64url first, then codec.)
5. **`formatVersion` must `===` runtime** — no silent shape coercion.
6. **`stateVersion` gate** — newer-than-runtime ⇒ refuse; older ⇒ run the pure migration chain (`upSuspension` + per-event `rewriteEvent`, §5.5); a gap ⇒ `{ ok:false, reason:'migration-gap' }`.
7. **Standard Schema validate** every persisted `pending.payload` and the resolution by `resolutionSchemaId`; unknown id ⇒ `{ ok:false, reason:'schema-missing' }` (the caller's `onSchemaMissing` fires).
8. **Never interpolate any field into SQL / file paths** — the `Checkpointer` binds the token as an opaque blob parameter only.

**Local path** (`trust: 'local'`): the token is a single unsigned segment from `sealLocal`. `open` skips steps 2–3 (no keyring, no subtle — insecure-context safe) and runs steps 1 (length + single-segment shape check), 4 (base64url-decode → JSON.parse, no decrypt), 5–8. Honest about the same-origin trust model.

Then: `deps`, `tools`, and `instructions` are re-provided by **reconstructing the same `agent(config)` and passing `RunOptions`** (never deserialized from the token); if a `tool.call`'s stamped `version` differs from the current tool, the `onToolDrift` middleware altitude (§3.8) decides proceed-or-`unresumable`; the pending call is completed with the schema-validated resolution; the loop continues with `seq` from `cursor + 1`. Resume is an `O(log)` fold, not re-execution.

### 5.5 Migrations

```ts
export interface StateMigration {
  readonly from: string; readonly to: string;      // stateVersion → stateVersion
  upSuspension?(p: SuspensionDescriptor): SuspensionDescriptor; // reshape the PENDING descriptor (in-flight runs)
  /** Reshape an already-RECORDED event before replay folds it — needed when a tool's input schema
   *  changed and old-shape `tool.call`/`tool.result` events sit in the log (closes D-F12). Total,
   *  pure, event-by-event; return the event unchanged if it doesn't apply. */
  rewriteEvent?(e: MithrilEvent): MithrilEvent;
}
```

A CI linter fails a `stateVersion` bump that lacks `upSuspension` coverage for known suspension kinds — otherwise in-flight HITL runs brick on deploy. `rewriteEvent` is applied to the recorded `log` during `open()` step 6 so replay reconstructs migrated state; because replay is a pure fold over the (now-migrated) log, no recorded model or tool call is re-executed.

### 5.6 Abort × suspend precedence (graft: P2)

A fired `AbortSignal` **wins**. The loop finalizes `status: 'cancelled'`, emits `run.cancel`, and does **not** persist a half-written suspension. Because state is an append-only log, a cancel is just another event — there is no mutable checkpoint to corrupt. Under durable persistence, `checkpointer.put()` is the single atomic commit point; a suspension is only durable once `put()` acks. This race is fuzz-tested, including provider stream aborts mid-`tool.result`.

---

## 6. Provider spec

A tiny, **published, versioned** spec. `'provider/model'` strings route over a `ProviderRegistry`; the same spec generates cost tables and capability flags.

```ts
export interface ProviderSpec {
  readonly id: 'anthropic' | 'openai' | 'google' | (string & {});
  readonly models: Readonly<Record<string, ModelSpec>>;
}
export interface ModelSpec {
  readonly capabilities: ModelCapabilities;
  readonly pricing: Pricing;          // integer micro-USD per token class; versioned
  readonly contextWindow: number;
}
export interface ModelCapabilities {
  readonly tools: boolean;
  readonly structuredOutput: boolean;
  readonly reasoning: boolean;        // gates reasoning.delta
  readonly promptCaching: boolean;
  readonly vision: boolean;
  readonly browserSafe: boolean;      // false ⇒ direct browser calls refused toward a proxy transport
}
export interface Pricing {
  readonly inputMicroUsdPerToken: number;
  readonly outputMicroUsdPerToken: number;
  readonly cacheReadMicroUsdPerToken: number;
  readonly cacheWriteMicroUsdPerToken: number;
  readonly reasoningMicroUsdPerToken: number;
}

/** The provider's semantic input for one model call (P1 — was undefined, so a Provider was unbuildable). */
export interface ChatRequest {
  readonly model: ModelId;
  readonly system: string;
  readonly messages: RunState['messages'];
  readonly tools: readonly AnyTool<unknown>[];                     // resolved tool schemas offered this step
  readonly output?: StandardSchemaV1<unknown, JsonValue>;         // structured-output target, if any
  readonly sampling?: { readonly temperature?: number; readonly maxTokens?: number; readonly topP?: number };
  readonly cacheHints?: readonly number[];                        // prompt-cache breakpoints (message indices)
}

/** A provider yields pre-EventMeta CHUNKS, NOT MithrilEvents (P2). The loop — the single `seq` authority
 *  (OQ-3) — stamps v/runId/seq/span/ts onto each chunk. This is why providers can't (and must not) assign
 *  `seq`, and why the model cache stores ProviderChunk[]: re-stamping on replay is deterministic. */
export type ProviderChunk =
  | { readonly type: 'text.delta';       readonly delta: string }
  | { readonly type: 'reasoning.delta';  readonly delta: string }
  | { readonly type: 'tool.input.delta'; readonly callId: string; readonly name: string; readonly partial: string }
  | { readonly type: 'tool.call';        readonly callId: string; readonly name: string; readonly input: JsonValue }
  | { readonly type: 'object.delta';     readonly partial: JsonValue }
  | { readonly type: 'message.end';      readonly usage: UsageDelta; readonly finishReason: FinishReason }; // 'length'/'content_filter' aren't content-inferable — provider must report
export interface Provider {
  readonly spec: ProviderSpec;
  // browserSafe providers auto-inject their own required header (e.g. anthropic-dangerous-direct-browser-
  // access) onto the transport's request; the consumer never wires it by hand (closes A-F1/R3).
  chat(req: ChatRequest, rt: RuntimeAdapter, transport: Transport, signal: AbortSignal): AsyncGenerator<ProviderChunk>;
}

/** The missing call site (closes the "provider wiring has no call site" blocker):
 *  connects a ModelId to a Provider. Passed via RunOptions.providers; the `mithril`
 *  meta-package installs a default one. Unknown provider/model ⇒ loud throw at config time. */
export interface ProviderRegistry {
  resolve(model: ModelId): Provider;
  readonly specs: readonly ProviderSpec[];
}
export function providerRegistry(...providers: readonly Provider[]): ProviderRegistry;

// Provider packages export a model-handle helper (returns ModelHandle) so referencing a model self-wires
// its provider and autocompletes the model names — the preferred, most discoverable form:
//   import { anthropic } from "mithril/anthropic";   agent({ model: anthropic("claude-fable-5"), … })
export function anthropic(model: string): ModelHandle;  // @mithril/providers/anthropic (re-exported by `mithril`)
export function openai(model: string): ModelHandle;     // @mithril/providers/openai
export function google(model: string): ModelHandle;     // @mithril/providers/google
```

**Rules.** Capability flags are runtime-checked, not just typed — a `provider/model` requesting an unsupported feature fails loud at config time. `browserSafe: false` providers (e.g. OpenAI's unconditional-CORS key leak) refuse direct browser calls and require a `proxy`/`ephemeral` transport — we ship a token-vending proxy recipe, not a lie. Provider adapters are producers of the one protocol and are **gated by `@mithril/core/testkit` conformance on every PR** (an out-of-order or non-conforming provider would corrupt replay/time-travel for everyone downstream). `@mithril/compat-ai-sdk` wraps Vercel AI SDK models into a `Provider`. Pricing tables are embedded and versioned; a reprice is a spec version bump.

**workerd note:** providers never call `crypto`/`Date.now`/`fetch` in module global scope (workerd forbids effectful global-scope calls); all such calls happen inside request scope through the injected `RuntimeAdapter`. On workerd `Date.now()` advances only after I/O, so `tool.result.ms` and per-event `ts` can be coarse — devtools meters annotate this rather than misreport it.

---

## 7. Context-engineering primitives

Context economics is a core concern (tool bloat ~1K tokens/tool; compaction; tool search). All primitives emit protocol events so devtools meters read straight off the stream.

```ts
export interface ContextPolicy {
  readonly tokenBudget?: number;                       // soft ceiling for the message window
  readonly compaction?: CompactionPolicy;
  readonly toolSearch?: ToolSearchPolicy;              // combat per-tool token bloat
}

export interface CompactionPolicy {
  /** fires when estimated window tokens exceed `triggerAtTokens` */
  readonly triggerAtTokens: number;
  /** pure: choose which seq range to summarize; the loop emits a `compaction` event and
   *  splices a summary message. Deterministic → replay-safe. */
  readonly strategy: (state: RunState, budget: number) => { readonly removeSeqRange: readonly [number, number] };
  /** OPTIONAL model call to produce the summary. It runs ONCE, at compaction time, and the result is
   *  written into the log (the `compaction` event's summary). REPLAY NEVER RE-INVOKES `summarize` — it
   *  reads the recorded summary from the log — so "replay reconstructs the compacted window exactly"
   *  holds off the replay path too, not only under the model cache. */
  readonly summarize?: (removed: readonly MithrilEvent[], ctx: { model: ModelId }) => Promise<string>;
}

export interface ToolSearchPolicy {
  /** only surface the top-K tools to the model per step, chosen from a larger registry,
   *  to keep the tool-definition token cost bounded. */
  readonly topK: number;
  readonly rank: (query: string, tools: readonly AnyTool<any>[]) => Promise<readonly string[]>;
}

export interface TokenEstimator { estimate(messages: RunState['messages']): number; }
```

Compaction is emitted as `compaction { removedSeqRange, summarySeq, savedTokens }`, and the summary text is itself an event in the log — replay reconstructs the compacted window exactly from the recorded summary, and devtools renders a context meter with no side channel.

---

## 9. Devtools & React — protocol consumption

Both are **pure consumers of `@mithril/core/protocol`** and are forbidden the loop by the `exports` map. This is what lets a browser tab render a run it isn't hosting.

### 9.1 React (`@mithril/react`, headless, peer: react)

```ts
export function useRun(source: RunHandle<any, any> | EventTransport): {
  readonly state: RunState;                 // = live fold via reduce()
  readonly text: string;
  readonly status: RunState['status'] | 'streaming';
  readonly events: readonly MithrilEvent[];
  readonly usage: UsageTotals;
  readonly costUsd: number;                 // costMicroUsd / 1e6
  readonly suspension?: SuspensionDescriptor;
  cancel(): void;
};

// Typed tool-call view for a specific agent, opt-in and local:
export function useToolCalls<A extends Agent<any, any, any, any>>(source: RunHandle<any, any> | EventTransport): InferUITools<A>[keyof InferUITools<A>][];

// HITL affordance — typed against the agent's Susp, exposes the full ApprovalDecision surface, validates
// the resolution against the pending descriptor's schema before sending. Accepts a live RunHandle
// (in-process / rehydrated — resolves via handle.resolve, same broadcast) OR a bare EventTransport
// (worker/server-rendered — resolves via publishResolution over the transport). One hook, both topologies.
export function useApproval<A extends Agent<any, any, any, any>>(source: RunHandle<any, any> | EventTransport): {
  readonly pending?: SuspensionDescriptor;
  resolve(decision: ResolutionOf<InferSuspension<A>>): void; // general typed resolution
  approve(): void;                                            // ApprovalDecision sugar
  reject(message: string): void;
  edit(input: JsonValue): void;
};

// Typed streaming of a structured `output` — the deep-partial object as it fills in, then the final value.
// Without this, consuming object.delta/object.final means filtering the raw event union by hand.
export function useObject<A extends Agent<any, any, any, any>>(source: RunHandle<any, any> | EventTransport): {
  readonly partial: DeepPartial<A extends Agent<any, any, infer Out, any> ? Out : never>;
  readonly value?: A extends Agent<any, any, infer Out, any> ? Out : never; // set once object.final lands
  readonly status: RunState['status'] | 'streaming';
};
```

A component driven by a bare `EventTransport` (BroadcastChannel/WebSocket) renders a run happening in a worker or server, catching up gap-free via `subscribe(onEvent, resumeFrom)`. For that topology the resolution travels back over the transport as a `resume` control event; `@mithril/react` ships a `publishResolution(transport, descriptor, decision)` helper so the coupling is specified, not invented per app. (The host loop treats a `resume` event addressed to the pending `callId`/descriptor as the resolution.)

### 9.2 Devtools (`@mithril/devtools`, `bunx mithril dev`)

Single-process, SQLite-backed event store, offline, Node/Bun only.

**Zero-touch attach.** You do not hand-wire `fanout` to see your runs. Either set `MITHRIL_DEVTOOLS=1` or add a single side-effect import at your entry (`import "mithril/devtools/attach"`), and *every* run in the process auto-fanouts to the local inspector — the "React DevTools for agents" wedge only holds if it attaches by being present, not by threading a transport into every `run()`. The attach shim tree-shakes/no-ops in production builds.

Live-tails via an `EventTransport`; **time-travel is `replay(log, cursor)`** — a fold, never a stored mutable checkpoint that can desync. Cost and context meters read directly off `usage` / `compaction` events (with the workerd coarse-timer caveat annotated, not hidden). The minimal chat playground is a `useRun` consumer. Sealed suspension tokens are decoded via the `Keyring` (and AES-GCM codec, if any) so humans get a readable view of the otherwise-opaque blob; `durable-local` tokens need no key.

### 9.3 OTel (`@mithril/otel`, peer: @opentelemetry/api)

```ts
export function toGenAiSpans(events: AsyncIterable<MithrilEvent>, opts?: { readonly captureContent?: boolean }):
  AsyncIterable<MithrilEvent>; // pass-through; tees spans as a side effect
```

`span.kind` + `span.id`/`parentId`/`traceId` on every event build the `gen_ai.*` hierarchy **directly off the wire**: `invoke_agent` (`run.start`/`run.finish`) > `chat` (`step.start`/`step.finish`) > `execute_tool` (`tool.call`/`tool.result`); `usage` → `gen_ai.usage.*` metrics. Metadata on by default; content (prompts/outputs) opt-in per principle. Pairing is carried, not reconstructed.

### 9.4 Errors and scaffolding (a first-class DX surface)

"Errors that tell you the fix" (Principle #1) is a deliverable, not a hope. Every throw is a typed `MithrilError` carrying a stable `code`, the offending value, and the one-line fix — catchable by `code`, never by string-matching. A representative catalog:

| `code` | Fires when | Message (abridged) |
|---|---|---|
| `NO_PROVIDER` | bare-string `model`, no registry/handle | `No provider for "anthropic/claude-fable-5". Use model: anthropic("claude-fable-5"), or pass providers:.` |
| `NO_API_KEY` | omitted transport, env var missing | `No ANTHROPIC_API_KEY set and no transport given. Set the env var or pass transport: { kind:'byok', apiKey }.` |
| `TOOL_OUTPUT_NOT_JSON` | tool returns a non-JSON value | `Tool "x" returned a Map; outputs must be JSON-safe. Return a plain object/array or add an outputSchema.` |
| `MISSING_KEYRING` | durable persistence, no keyring | (compile error first) runtime: `durable persistence needs a keyring — singleKeyring(await generateStateKey()).` |
| `UNSUPPORTED_CAPABILITY` | model asked for a feature it lacks | `Model "x" has capabilities.tools=false. Pick a tool-capable model or drop the tools.` |
| `STATE_INTEGRITY` | seal verify failed / stripped envelope | `Refusing a token that failed HMAC verification (possible tampering). trust:'sealed' requires a 3-part envelope.` |

**`create-mithril`** scaffolds a *running* streaming chat in under ten lines from the `mithril` meta-package — the strongest DX statement the project makes is its first-run experience. Templates: `node-cli`, `bun-server`, `browser-byok`, `react-chat`. Each ships the devtools attach line one comment away and a passing `bun test` with one recorded fixture, so record/replay is demonstrated from minute one.

---

## 10. Memory / Checkpointer

Interface + conformance kit ship **in core** (state correctness is a core concern); durable impls live in `@mithril/memory` behind explicit per-runtime subpaths.

```ts
export interface CheckpointRecord {
  readonly runId: string;
  readonly checkpointId: string;   // monotonic ULID (derived from getRandomValues — insecure-context safe)
  readonly parentId: string | null;
  readonly token: SerializedRunState | null; // sealed (durable) / unsigned (durable-local) blob; null if unsealable
  readonly status: RunState['status'];
  readonly createdAt: string;
  /** Unsealed, non-sensitive: lets a UI render "applyPatch awaiting approval" on reopen WITHOUT opening
   *  the token (so no subtle/keyring needed just to show what's pending) — closes A-F2/R4. */
  readonly pending?: SuspensionDescriptor;
}
export interface Checkpointer {
  put(rec: CheckpointRecord, opts?: { readonly ifParent?: string | null }): Promise<'ok' | 'conflict'>; // optimistic concurrency
  latest(runId: string): Promise<CheckpointRecord | undefined>;
  get(runId: string, checkpointId: string): Promise<CheckpointRecord | undefined>;
  history(runId: string): AsyncIterable<CheckpointRecord>; // time-travel / branching
  purge(runId: string): Promise<void>;
}

// Ships in core; every impl must pass it:
export function checkpointerConformance(make: () => Promise<Checkpointer>, t: TestAdapter): void;
// covers: roundtrip, latest, monotonic history order, ifParent conflict, idempotent put, purge,
//   large token, tampered-token rejection at open(), binary/unicode safety (UTF-8 base64url path),
//   concurrent writers, and (browser backends) eviction/quota semantics.
```

Runtime backends are **explicit per-runtime subpaths, never single-subpath runtime branching**: `/memory`, `/sqlite-node` (`node:sqlite`), `/sqlite-bun` (`bun:sqlite`), `/opfs` (IndexedDB+OPFS), `/kv` (workerd KV/DO). Each is a thin blob store binding tokens as opaque parameters. (The `node:sqlite`/`bun:sqlite` split avoids a static import that would fail to load on the other runtime; `node:sqlite` maturity is tracked in OQ-7.)

### 10.1 Runtime-agnostic capability adapters

Some capabilities a tool needs differ by runtime. Rather than let tools reach for `node:*` (and break in the browser), Mithril ships them as small, intersection-shaped interfaces injected via `Deps`, with explicit per-runtime impls — the `Checkpointer`/`Transport`/`fs` pattern. The rule for what earns an adapter, and the anti-rule against a portable-everything kitchen sink:

| Kind | Where it lives | Examples |
|---|---|---|
| **Universal** (a web standard in every runtime) | `RuntimeAdapter` — no per-capability adapter | fetch, now, randomUUID, crypto |
| **Differs by runtime, honest intersection** | Deps-injected adapter, explicit per-runtime subpaths | `fs`, `kv`, `VectorStore` |
| **Impossible in the browser** | honest-degradation adapter (proxy / WASM), or a recipe — never a fake local impl | `CodeRunner`, database, object store |

Three laws every adapter obeys: **promise the cross-runtime intersection, not any one runtime's superset**; **inject via `Deps`, not `RuntimeAdapter`** (these aren't universal, so they don't belong on the universal seam); **explicit per-runtime subpaths, never runtime auto-detection**. Each ships a conformance kit so every backend is held to identical observable semantics.

**Filesystem (`@mithril/fs`, v1)** — the reference implementation. A tool that reads or writes files must run unchanged on server and browser: one interface, explicit per-runtime impls, injected via `Deps` (so `ctx.deps.fs` in a tool is byte-identical everywhere; only the wiring at the app edge differs).

```ts
// @mithril/fs — interface + conformance kit. Async-only, path-based, ROOTED (cannot escape its base),
// Uint8Array + Web Streams (never Node Buffer). The promised surface is the CROSS-RUNTIME INTERSECTION.
export interface FileSystem {
  readText(path: string): Promise<string>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array | string): Promise<void>;
  readable(path: string): Promise<ReadableStream<Uint8Array>>;   // opfs: Blob.stream(); node: Readable.toWeb()
  writable(path: string): Promise<WritableStream<Uint8Array>>;   // opfs: createWritable(); node: Writable.toWeb()
  list(dir: string): AsyncIterable<{ readonly name: string; readonly kind: 'file' | 'directory' }>;
  stat(path: string): Promise<{ readonly size: number; readonly lastModified: number; readonly kind: 'file' | 'directory' }>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;   // recursive
  remove(path: string): Promise<void>;  // recursive, confined to root
}
// Explicit per-runtime constructors (subpaths, NOT runtime auto-detection — same no-magic rule as memory):
export function nodeFileSystem(root: string): FileSystem;   // @mithril/fs/node  — fs/promises, path-traversal rejected
export function bunFileSystem(root: string): FileSystem;    // @mithril/fs/bun
export function opfsFileSystem(subdir?: string): FileSystem;// @mithril/fs/opfs  — navigator.storage.getDirectory()
export function memoryFileSystem(): FileSystem;             // @mithril/fs/memory — tests / ephemeral, every runtime
export function fileSystemConformance(make: () => Promise<FileSystem>, t: TestAdapter): void;
```

**Deliberate limits, so it isn't nominal support:** async-only (OPFS has no cross-runtime sync API); no symlinks, permissions, or watch; `stat` is size + lastModified + kind only (OPFS has no more). **Rooted is a feature, not a gap** — a `FileSystem` can never escape its base, enforced on Node/Bun and inherent on OPFS, so path-traversal and "read `/etc/passwd`" tools are unexpressible by design. OPFS quota/eviction is best-effort (same caveat as `durable-local`; ships `estimate()`/`persist()` guidance). **workerd** has no OPFS — back it with an `r2FileSystem(bucket)` adapter or leave it unwired. Filesystem is **not** on `RuntimeAdapter`: it isn't a universal capability, so forcing every runtime to provide one would bloat the universal seam — it stays an opt-in injected dependency.

### 10.2 Key–value (`@mithril/kv`, v1)

General-purpose small-value storage for tools — result caches, dedup sets, rate-limit counters, scratch state. Distinct from `Checkpointer` (run-state, framework-owned); this is for tool authors.

```ts
export interface KeyValue {
  get<T = Uint8Array>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, opts?: { readonly ttlMs?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
export function memoryKv(): KeyValue;                    // @mithril/kv/memory — every runtime
export function indexedDbKv(name?: string): KeyValue;   // @mithril/kv/indexeddb — browser
export function sqliteNodeKv(path: string): KeyValue;   // @mithril/kv/sqlite-node
export function sqliteBunKv(path: string): KeyValue;    // @mithril/kv/sqlite-bun
export function workerKv(binding: unknown): KeyValue;   // @mithril/kv/kv — workerd KV (native TTL)
export function kvConformance(make: () => Promise<KeyValue>, t: TestAdapter): void;
```

Honest caveat: TTL is native on workerd KV and emulated elsewhere (lazy-expire on read + periodic sweep); the conformance kit pins the observable semantics (an expired key reads as absent) so a tool behaves identically across backends.

### 10.3 Vector store (`@mithril/vectors`, v1.x — the portable RAG core)

Declared now so the v1.x RAG package is designed agnostic from day one rather than pgvector-first. Retrieval is the other big differs-by-backend need, and the in-memory brute-force impl genuinely runs in the browser for small corpora.

```ts
export interface VectorStore {
  upsert(items: readonly { id: string; vector: Float32Array; metadata?: JsonValue }[]): Promise<void>;
  query(vector: Float32Array, opts: { readonly topK: number; readonly filter?: JsonValue }):
    Promise<readonly { id: string; score: number; metadata?: JsonValue }[]>;
  delete(ids: readonly string[]): Promise<void>;
}
export function memoryVectors(): VectorStore;             // brute-force cosine — browser-capable, small corpora
export function sqliteVecVectors(path: string): VectorStore;    // sqlite-vec (node/bun)
export function pgVectors(conn: unknown): VectorStore;          // pgvector (server)
export function vectorizeVectors(binding: unknown): VectorStore;// workerd Vectorize
```

Honest caveat: recall and latency differ by backend (exact brute-force vs ANN indexes) — the interface promises the query *shape*, not identical ranking. `Float32Array` keeps embeddings clone-safe and web-standard.

### 10.4 Sandboxed code execution (`@mithril/sandbox`, v1.x+ — honest degradation)

Running code/shell is a top agent use case and **impossible natively in a browser** — so "agnostic" here means a stable interface whose browser impl runs code in WASM or proxies to a server, never a fake local shell. Flagged for deliberate design (it's the TS-sandbox gap the research named), not a rushed addition.

```ts
export interface CodeRunner {
  run(code: string, opts?: {
    readonly language?: 'js' | 'python';
    readonly timeoutMs?: number;
    readonly files?: FileSystem;      // mount a rooted fs (§10.1) as the sandbox's filesystem
  }): Promise<{ readonly stdout: string; readonly stderr: string; readonly result?: JsonValue }>;
}
export function nodeSandbox(opts?: unknown): CodeRunner;   // isolated-vm / gVisor-class — REAL isolation, never eval
export function wasmSandbox(opts?: unknown): CodeRunner;   // QuickJS (js) / Pyodide (python) — runs IN the browser
export function remoteSandbox(url: string): CodeRunner;    // proxy to a server executor (browser → your sandbox API)
```

The `wasmSandbox` is the payoff: a coding agent executing JS/Python client-side, no server. Honest limits: WASM sandboxes are slower, memory-bounded, and have no network/filesystem except what you mount via `files`; `nodeSandbox` requires a real isolation boundary (isolated-vm/gVisor-class), **not `eval`** — designing that boundary is exactly what gets the roast-before-build treatment.

### 10.5 Deliberately recipes, not adapters

Two capabilities were considered and left as documented recipes — building them as framework adapters would be over-abstraction:

- **Database (SQL).** A browser can't hold a raw DB connection or credentials; the honest browser path is "call your API," which is just a `fetch` tool. A `Database` adapter would mostly wrap "proxy to a server," adding surface for no portability win. Recipe: a server-only tool using a driver, or a `fetch` tool against your API.
- **Object storage (S3/R2/GCS).** Same shape — browsers use presigned URLs (a `fetch`), servers use SDKs, workerd uses an R2 binding. Recipe: presigned-URL upload/download tools. `@mithril/fs` already covers *local* file IO, which is the part that genuinely needs an intersection.

If a future need turns one of these into a true intersection (e.g. a WASM SQLite running the same query in browser and server), it graduates to an adapter under the §10.1 rules.

---

## 11. Explicitly-decided naming

| Concept | Decided name | Rejected alternatives / note |
|---|---|---|
| The three nouns | `tool`, `agent`, `plugin` (+ eject hatch `agentLoop`) | `definePlugin` (verb-inconsistent with `tool`/`agent`); `runLoop` (collides with `agent.run`) |
| Deps binding (app) | `createHarness<Deps>()` → `{ agent, tool, plugin }`, bound once | per-call `<Deps>()` at every definition (the curry, kept as the lower primitive) |
| Model selection | `model: anthropic("…")` handle (self-wiring) OR `"provider/model"` string | string-only (registry footgun, no autocomplete) |
| No-deps run | `agent.run("hi")` — no options object (Deps = void ⇒ opts optional) | mandatory `opts` with `deps: undefined`, hand-built transport |
| React hooks | `useRun`, `useObject`, `useApproval`, `useToolCalls` | `useMithril` (vendor-named, says nothing) |
| Middleware context | `MiddlewareContext` | `MwContext` (abbreviation) |
| Typed-DI binding (primitive) | curried `agent<Deps>()(config)` / `tool<Deps>()(def)` | positional type args (kills `const Tools`); config `deps` witness (no field can infer Deps) |
| Suspension typing | `suspends` config field → `SuspensionOf<Susps>` | recovering `Susp` from `execute` bodies (unrecoverable) |
| Event union | `MithrilEvent` | `AgentEvent` (too loop-coupled; the protocol outlives the loop) |
| Union evolution | non-exhaustive contract; additive = MINOR (§4.2) | per-consumer `assertNever` (makes every add a MAJOR) |
| Event type convention | dot-namespaced: `run.start`, `tool.call`, `object.final` | kebab (`run-start`) rejected for consistency with `custom.${string}` |
| Custom event escape hatch | `` `custom.${string}` `` + `CustomEventOf<Id, P>` | plain `EventOf<'custom.x'>` (= never) |
| Terminal run states | `completed` \| `suspended` \| `cancelled` \| `error` | `done`/`finished` → `completed`; `aborted` → `cancelled` |
| Model finish reason | `stop`\|`length`\|`tool_calls`\|`content_filter`\|`error` | distinct from run status |
| DI context | `RunContext<Deps>`; fields `deps`, `signal`, `runId`, `step`, `usage`, `runtime`, `emit`, `suspend`, `journal` | — |
| Model routing | `ModelId` + `ProviderRegistry.resolve(model)` | imported model objects (lose late binding); no registry (unresolvable) |
| Suspension marker | `suspend()` returning `Suspend<Out>`; `SUSPEND` unique symbol | — |
| Suspension request | `SuspensionRequest<Kind, Payload, Resolution>` (+ `resolutionSchemaId`) | — |
| Suspension schema access | `SchemaRegistry` + `schemaRegistry()` / `schemaRegistryFor(agent)` | leaving the registry unconstructable |
| Canonical HITL | `ApprovalRequest` / `ApprovalDecision` (`approve`\|`reject`\|`edit`) | — |
| Serialized run token | `SerializedRunState`, branded `mithril.runstate.v1` | — |
| Seal/open | `seal(body, keyring, rt, codec?)` / `open()` (trust boundary); 3-part `header.payload.digest`, sign over transmitted bytes | `freeze`/`thaw`; 2-part envelope (no authenticated kid/codec header); canonical-body signing (breaks verify-before-parse) |
| Signing key | `Keyring` (`current()`/`resolve(kid)`), `kid` in the authenticated header | raw `CryptoKey` (no rotation, no kid selection) |
| Durability input | discriminated `persistence` (`ephemeral`\|`durable-local{checkpointer}`\|`durable{checkpointer,keyring,codec?}`) | optional `stateKey?` + `checkpointer?` (key requirement invisible to compiler); a single durable mode (no insecure-context path) |
| Resume path | `agent.resume()` (headless cross-process) + `agent.rehydrate()`→`RunHandle` (streamed cross-process) + `RunHandle.resolve()` (in-process) | inline `result.resume` closure (in-process-only trap); `open()` returning a body nothing consumes |
| Narrowing primitive | `narrow()` as a **type predicate** | union-returning `narrow` (type-level no-op) |
| Effect journaling | `ctx.journal(key, fn, schema?)` | `ctx.step` (collides with `step` counter) |
| Runtime seam | `RuntimeAdapter` / `defaultRuntime()`; `subtle?` optional; `getRandomValues` always | required `subtle` (breaks insecure-context browsers) |
| Transport seam | `Transport` (`byok`\|`proxy`\|`ephemeral`) | — |
| Event fan-out | `EventTransport` (`inMemory`/`broadcastChannel`/`webSocket`/`durableObject`) | distinct from `Transport` (model transport) |
| Durable store | `Checkpointer`; subpaths `/sqlite-node`, `/sqlite-bun` | single `/sqlite` subpath (runtime-branching import) |
| Cost unit | integer `costMicroUsd` | float USD (drift) |
| Prompt constants | `DEFAULT_PROMPTS` | — |
| Core entrypoints | `@mithril/core/protocol`, `/agent`, `/testkit` | — |
| Delegation | `agent.asTool({ name, description })`; sub-agent inherits parent RunContext | — |
| Package scope | `@mithril/*` | — |

---

## 12. Open questions — resolved in the design walk (2026-07-20)

All OQs were resolved on 2026-07-20. Four were product-shaping forks decided by the owner (marked **[owner]**); the rest resolved to a best-practice brick or an execution item. Items still needing empirical tuning or a proof before 1.0.0 are flagged **[pre-1.0]** — decided in shape, numbers/proof pending.

- **OQ-1 — Signing-key management & rotation. → `Keyring` brick.** Don't pass a raw `CryptoKey`; pass a `Keyring` (`resolve(kid) → key`, `current() → {kid, key}`). The seal envelope carries `kid`; rotation = add a key, retain old keys for verify. Default `singleKeyring(generateStateKey())`. No "disable integrity" flag. The `ephemeral` branch vends no key.
- **OQ-2 — Confidentiality vs integrity. → ship AES-GCM default codec. [owner]** `SealCodec` stays pluggable; the wire default remains HMAC-integrity, and v1 also ships a real `aesGcmCodec` for at-rest confidentiality (nearly free on WebCrypto), closing the plaintext-PII gap. Codec identifier travels in the envelope; verify/decrypt order preserves verify-before-parse (Principle #8).
- **OQ-3 — Ordering authority. → single `seq` authority; span-tree for the future. [owner]** One deterministic ordering counter per run; parallel emissions (incl. middleware, §3.8) serialize through it, guaranteeing replay/time-travel correctness (Principle #2). The fan-out throughput ceiling is accepted and documented; wall-clock concurrency stays recoverable via `ts` + `span.kind`. The span tree is shaped so per-subrun `seq` can be added later additively (§13).
- **OQ-4 — Raw provider bytes. → `rawSidecar()` consumer brick.** Opt-in, off by default, size-capped, redaction hook; never enters the semantic replay log. Debugging raw bytes is an attachable sink (§3.8), not a core feature — validates the plugin model.
- **OQ-5 — Schema-id drift. → graceful-degradation policy.** Schema ids are versioned and never hard-removed within a deprecation window. A missing id resolves to a typed terminal `unresumable` state carrying the original request, plus an `onSchemaMissing` hook — a suspension failure becomes recoverable data, never a crash. Ids are part of the migration contract.
- **OQ-6 — Tool-signature drift. → `toolVersioningMiddleware()`.** Stamp a tool `version` (or structural hash) on every pending call; on resume, drift routes to an `onToolDrift` middleware hook (§3.8) or fails typed. A natural first customer of the middleware brick.
- **OQ-7 — Browser/workerd durability. → `/kv` adapters in the v1 cut. [owner]** Ship `Checkpointer` adapters: IndexedDB/OPFS (browser), KV binding (workerd), SQLite (node/bun). The conformance kit encodes eviction/quota; durability is documented as best-effort under host eviction, with `estimate()`/`persist()` preflight. Makes the cross-runtime durability claim real, not nominal. `/sqlite-node` pins a `node:sqlite` stability floor.
- **OQ-8 — `Deps` inference. → resolved.** Curried `agent<Deps>()` / `tool<Deps>()` factories give `Deps` a single binding site; typed DI no longer degrades to `unknown` and `const Tools` capture survives. Guarded by a 100-tool + typed-deps CI fixture.
- **OQ-9 — tsc budget. → numbers set now.** Hard CI gates on the 100-tool fixture: a type-instantiation-count ceiling, depth caps on `ToolCallFor`/`narrow`, and `@ts-expect-error` diagnostic-shape snapshots so error-quality regressions also fail CI. A 20-plugin fixture (§3.8) extends the budget to the plugin seam.
- **OQ-10 — Protocol `v:2` migration. → additive-only, prove the codec. [pre-1.0]** Additive-only union evolution is declared (§4.2). Remaining: prove the `migrate()` codec + golden-corpus round-trip (including reduce-tolerates-unknown-member) before 1.0.0.
- **OQ-11 — Backpressure defaults. → policy fixed, numbers provisional. [pre-1.0]** Policy locked (lossless log tee, lossy bounded fanout). Provisional defaults: fanout ring buffer 1024 events; provider-idle-timeout 30s trips a lossy gap marker. Both flagged for empirical tuning against real slow-consumer traces before lock.

**New in this walk:** the producer-side composability layer (§3.8) — `Middleware` + `Plugin`, both v1 **[owner]** — was added to make Mithril a lego system rather than a monolith. It is the home for OQ-4/OQ-6 resolutions and for context-engineering (§7) as attachable bricks.

---

## 13. Considered and rejected

Deliberate rejections where an obvious "fix" would compromise a core principle, plus the trade-offs accepted with eyes open.

- **Positional `Deps`/`Susp` type arguments on `agent`/`tool`.** Rejected: supplying `Deps` positionally destroys `const Tools` capture (Principle #4/#10). Adopted the curried factory + `suspends` field instead, accepting one extra call for the typed-DI path only.
- **Making every additive event a MAJOR release (or forbidding exhaustive matching entirely).** Rejected both extremes. Instead declared a **non-exhaustive union contract** (§4.2): `reduce` is total, `assertKnownEvent` is tolerant, additive members are MINOR. This keeps the protocol evolvable (Principle #1) without silently breaking downstream `switch`es.
- **Signing over a canonicalized body.** Rejected: canonicalization requires parsing hostile bytes before verification, defeating verify-before-parse (Principle #8) and the LangGraph-RCE defense. The envelope signs the exact transmitted bytes; the cost is that two byte-different encodings of the same state are different tokens — acceptable, since the producer controls encoding.
- **Requiring a signing key unconditionally, or leaving it optional.** Rejected optional (invisible runtime throw) and rejected always-required (kills zero-config dev and blocks insecure-context browsers). Adopted the three-way discriminated `persistence` input: `ephemeral` (no key, in-process only), `durable-local` (same-origin, unsigned, insecure-context-safe), `durable` (cross-store, `Keyring` compile-time-required). The key requirement is present *exactly* where a cross-store token is emitted, nowhere else.
- **Keeping the inline `result.resume(resolution)` closure.** Rejected: it only survives in-process and is a trap for the flagship distributed-HITL case. Split into clearly-delineated paths: `agent.resume(token, …)` (headless cross-process) and `agent.rehydrate(token, …)` returning a live `RunHandle` (streamed cross-process, so the UI can render the pending suspension before deciding), plus `RunHandle.resolve(…)` (in-process, same broadcast). `open()` returns an `OpenResult` the resume path consumes — never a dead-end body.
- **Per-subrun `seq` spaces to lift the fan-out ceiling (OQ-3).** Owner-decided against for v1: a single ordering authority is what makes replay/time-travel deterministic (Principle #2). We accept the throughput ceiling and document it; wall-clock concurrency remains recoverable via `ts` + `span.kind`. The span tree is shaped so per-subrun `seq` is an additive future change once a stitching design is proven.
- **A private middleware side channel (OQ/§3.8).** Rejected: allowing middleware to pass data or effects outside `MithrilEvent` would create a second, hidden control plane — the exact re-introduction of framework magic (LangChain hidden-prompt class) the protocol-first design exists to prevent. Middleware observes and transforms only via emitted events through the single `seq` authority, keeping every extension replayable, inspectable, and scoreable.
- **Unioning plugin-contributed tool types into the agent's global tool type (§3.8).** Rejected: it would inflate every consumer's tsc instantiation depth per installed plugin, reintroducing the collapse the monomorphic wire prevents. Plugin tools are runtime-callable but their static types are recovered locally via `InferPluginTools`; a 20-plugin CI fixture holds the budget.
- **Type-enforcing "all effects go through `ctx.journal`" (Tier-2).** Rejected as impossible in the type system. Tier-2 stays the documented sharp edge, guarded by an ESLint rule + runtime nondeterminism detector; Tiers 1/1b are structurally replay-free and cover the majority (Principle #7).
- **Hard `Out extends JsonValue` constraint everywhere.** Softened to a `JsonSafe<T>` assertion applied at the factory boundaries that actually produce wire values (tool output, structured output, suspension payload). A blanket constraint would spuriously reject legitimate Standard Schema output types; the boundary assertion still fails a non-serializable value at *definition* rather than at `structuredClone`.
- **A single `/sqlite` subpath with runtime detection.** Rejected: a static `node:sqlite`/`bun:sqlite` import cannot load on the other runtime, and dynamic-import branching contradicts "never conditional-export magic." Split into explicit `/sqlite-node` and `/sqlite-bun`.
- **The static `node:`-import CI scan as the portability contract.** Rejected as the contract (kept as a pre-filter): it cannot catch secure-context unavailability, workerd global-scope crypto bans, or coarse `Date.now()`. Replaced by an *executing* workerd-isolate + insecure-context-browser matrix (Principle #6) — the only thing that catches "fails on contact."

### Added in the validation-hardening pass (2026-07-20)

- **Leaking a sub-agent's `Susp` union into the parent's generics (via `asTool`).** Rejected: it forces the orchestrator to statically know every child's suspension types and re-declare them, and it fights `const Tools` capture. Adopted the built-in `HandoffSuspension` re-frame — a child suspension surfaces to the parent as one known kind carrying the child descriptor; resolving it forwards down and is validated by the *child's* schema. The parent stays closed regardless of child suspensions.
- **Providers yielding fully-stamped `MithrilEvent`s.** Rejected: the provider cannot own `seq`/`span`/`runId` (the loop is the single ordering authority, OQ-3), so it would either invent colliding seqs or bake record-time metadata that replay can't reproduce. Providers yield pre-`EventMeta` `ProviderChunk`s and the loop stamps — one fix that also lets the model cache store `ProviderChunk[]` and re-stamp deterministically.
- **A single durable persistence mode requiring `subtle`.** Rejected: it makes durable resume impossible on insecure LAN origins (phone testing), a hard contradiction with the browser-runtime goal. Split into `durable-local` (same-origin, unsigned — the hostile-transport threat is absent there) and `durable` (cross-store, sealed). Honesty over a nominal guarantee.
- **`FileSystem` on `RuntimeAdapter`, or an `autoFileSystem()` that detects the runtime.** Rejected both (§10.1). Filesystem isn't a universal capability (workerd has none), so putting it on the universal `RuntimeAdapter` seam would bloat it and force every runtime to supply one — it's an opt-in dependency instead. And runtime auto-detection is the conditional-export magic the portability recipe rejects; explicit per-runtime subpaths (`@mithril/fs/node` | `/opfs` | …) are the honest form. The interface promises the cross-runtime intersection (async, rooted, POSIX-lite), not Node's superset, so a tool written against it genuinely runs on OPFS.
