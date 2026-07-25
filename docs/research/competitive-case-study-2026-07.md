# Mithril vs. the Field — A Code-Level Competitive Case Study (July 2026)

> Produced 2026-07-25 by a code-grounded competitive sweep: 5 agents reading `packages/*/src`
> first-hand, 4 agents reverse-reading each competitor's published source/architecture, a
> dimension-by-dimension synthesis, and an **adversarial verification pass** that re-checked every
> proposed opportunity against Mithril's actual source (killing overclaims). Two subsystem reads
> (the core loop and the providers) were redone by hand after their structured-output agents failed,
> so their claims below are first-hand with `file:line` citations.
>
> **Frameworks compared:** **Mithril** · **eve** (Vercel, `eve` v0.27.6) · **Vercel AI SDK**
> (`ai` v6) · **Mastra** (`@mastra/core` ~1.2M wk) · **LangGraph.js** (`@langchain/langgraph`
> v1.0.x). Reliability is judged **from the code**, not from stars or downloads.
>
> Companion docs: [`landscape-2026-07.md`](landscape-2026-07.md) (market map — predates eve) and
> [`self-correction-2026-07.md`](self-correction-2026-07.md) (the research behind the healing stack).

---

## 0.1 Update — 2026-07-25: four fixes shipped

Since this study was written, four of its opportunities have been implemented against the source
(strict TS, tests, browser-safe gate all green):

- **#1 Correctness CI** — `.github/workflows/ci.yml` now gates every push/PR on `bun test` +
  `bun run typecheck` + `bun run check:browser-safe`. The local discipline is finally *enforced*.
- **#6 MCP client completed** — full lifecycle `initialize` → `notifications/initialized` handshake
  (lazy, once, concurrency-safe), negotiated `protocolVersion`/`capabilities`/`serverInfo`,
  server-assigned `Mcp-Session-Id` captured and echoed, `tools/list` pagination, `structuredContent`
  preference, `ping`, a typed `McpError`, and — the fail-loud fix — **`isError` now throws** instead
  of passing a server failure off as success. Server side gained notification handling, session ids,
  protocol-version negotiation, and a malformed-body guard.
- **#11 Parallel tool execution** — a turn's independent tool calls now run in a bounded-concurrency
  pool (`maxConcurrentTools`, default 8; `1` restores sequential) with **ordered commit** so events
  and message history stay deterministic. Tier-1 approval is a barrier resolved *before* any
  execution (a gated call never speculatively runs later calls); a mid-tool suspension forms a second
  barrier, earliest wins. See §4.3's note.
- **#12 Multimodal message parts** — `user` messages accept `text` / `image` / `file` parts (URL,
  base64, or raw `Uint8Array`, normalized to JSON-safe `data:` URLs so tokens still round-trip),
  serialized per-provider for OpenAI (`image_url`/`file`), Anthropic (base64 `image`/`document`
  blocks), and Google (`inlineData`/`fileData`); text-only local models get a flattened rendering.

Two bonus code-level gaps from this study (**inert cost budget**, **provider retry/backoff**) remain
open. The dimension scorecard below is unchanged except where noted; the roadmap statuses are updated.

---

## 0. TL;DR

**Mithril is the cleanest, most portable, most type-disciplined, and lowest-churn design in the
set** — and it is genuinely alone on three axes competitors structurally sacrifice:

1. **Runtime-agnosticism that is *enforced*, not claimed** — the full agent loop *and* durable
   state run in a browser, gated by a static `check:browser-safe` pass over 33 entrypoints. No
   competitor runs both loop and persistence in the browser.
2. **One stable typed contract** — `MithrilEvent`. Devtools, React, OTel, and replay are pure folds
   over it with no private side-channel, so they *cannot* desync. Everyone else exposes several
   simultaneously-moving contracts (AI SDK: 6 majors in 3 years).
3. **Small-model self-correction as composable middleware** — argRepair, leaked-tool-call salvage,
   loop-guard, retry-budget, output-retry — a battery none of the four competitors ship.

It is **genuinely behind** on: durability *depth* (LangGraph/eve/Mastra checkpoint per-step; Mithril
only at suspend/terminal), memory/RAG/vectors (Mastra's threads+semantic-recall vs Mithril's
brute-force cosine, no ANN), provider breadth (AI SDK ~30 vs Mithril's 4), MCP protocol completeness,
and the whole distribution layer (no channels, no deploy, no runtime CLI).

**The trust gap is not the tests** (56 test files, 200+ cases, suite green, every durable backend
re-runs the in-memory conformance kit). It is **process and adversarial-edge coverage**: there is
**no correctness CI** (only docs deploy), the cross-process checkpoint guard has a **TOCTOU race**,
resume is **at-least-once with no dedup**, and the **cost budget is silently inert** because no
provider ever populates cost.

The strategic play: **keep** the protocol-first / zero-dep / browser-safe / one-contract identity;
**close** durability depth + MCP correctness + defensive edges + correctness CI; **add** the memory
and channels batteries that separate "a harness" from "a product you ship."

---

## 1. Methodology & why this is trustworthy

- **Reliability is read from code, not popularity.** Every claim cites a source file, a symbol, or a
  specific doc contract. Download counts appear only as market context, never as evidence of quality.
- **Mithril was read first-hand** across all subsystems (`packages/*/src`), including a `bun test` /
  `typecheck` / `check:browser-safe` rigor pass.
- **Competitors were read from their published source/architecture** (`vercel/ai`, `mastra-ai/mastra`,
  `langchain-ai/langgraphjs`, `vercel/eve`) plus official docs — not from their marketing.
- **Every improvement opportunity was adversarially verified** against Mithril's real source before
  it made this list. The verifiers *rejected or corrected* several tempting-but-wrong findings — the
  unified pause/resume event, input-aware approvals, ANN vectors, and the WASM sandbox all turned out
  to already ship or to be correctly on the Roadmap. That correction step is what keeps this honest,
  in the spirit of the repo's "no overclaiming, verify against source" rule.

---

## 2. The five bets on "what an agent is"

| Framework | Core primitive | Public contract | Ceremony | Runtime deps in core |
|---|---|---|---|---|
| **Mithril** | **Typed event stream** | one `MithrilEvent` stream | Low | **Zero** |
| LangGraph.js | Pregel/BSP graph + channels | Graph API (3 schema generations) | High | LangChain core |
| eve | Agent-as-directory (filesystem) | filesystem conventions | Very low (human) / untyped seam | vendored `@workflow/*` beta + Nitro |
| Mastra | Server-side `Agent` + workflow engine | REST + AI-SDK stream shapes | Medium | 20+ (incl. `execa`, `ws`, posthog) |
| Vercel AI SDK | Provider spec + UI transport | `LanguageModelV3` + UI Message Stream | N/A (not a harness) | large mixed pkg |

- **Mithril** — the agent *is* a typed event stream; everything else is a fold over it.
- **LangGraph.js** — the agent is a graph of nodes over typed channel-state, run in supersteps with a
  barrier. Maximally controllable, maximally ceremonious.
- **eve** — the agent *is a directory*: `tools/*.ts` (filename = tool name), `skills/`, `channels/`,
  compiled to a `.eve/` manifest. Great human/coding-agent DX; correctness moves to compile-time,
  outside the type system.
- **Mastra** — the agent is an object in a server you deploy; you build a *service*.
- **Vercel AI SDK** — not a harness at all: a provider abstraction + UI transport. `ToolLoopAgent` is
  a thin in-memory loop added in v6.

---

## 3. Scorecard — where Mithril stands, by dimension

`▲ ahead · = at-parity · ▼ behind` (relative to the strongest competitor on that axis)

| # | Dimension | Mithril | Best-in-class | Why |
|---|---|:--:|---|---|
| 1 | Core model / contract cleanliness | ▲ | Mithril | Only single, stable, typed event stream as *the* contract |
| 2 | Runtime portability (loop **and** state) | ▲ | Mithril | Only one running both loop + durable state in-browser; enforced by static gate |
| 3 | Durability & resume depth | ▼ | LangGraph.js | Mithril checkpoints suspend/terminal-only; no time-travel; racy cross-proc guard |
| 4 | Human-in-the-loop **safety** | ▲ | Mithril / eve | Typed event, not thrown exception; no node-re-execution footgun |
| 4b | HITL **richness** (channels, caller identity) | ▼ | eve | eve unifies approvals+questions, has caller-aware policies + native channel render |
| 5 | Streaming granularity | = | LangGraph.js | Mithril one clean stream; LangGraph richer modes |
| 5b | Self-correction / small-model healing | ▲ | Mithril | Composable healing middleware nobody else ships |
| 5c | Structured-output guarantees | = | (none) | All five validate-then-repair; none do grammar decoding |
| 6 | Provider breadth | ▼ | AI SDK | 4 hand-written vs ~30 normalized |
| 6b | Provider **test integrity** | ▲ | Mithril | Real SSE parsers via injected `fetch`, zero mocking |
| 7 | Memory / RAG / vectors | ▼ | Mastra | No threads/semantic-recall; brute-force cosine, no ANN |
| 8 | Observability architecture | ▲ | Mithril | Can't-desync folds, runtime-agnostic, MIT |
| 8b | Observability **semconv conformance** | ▼ | AI SDK / Mastra | OTel fold diverges from `gen_ai.*`, ships no `@opentelemetry/api` adapter |
| 9 | Tools & MCP completeness | = ▲ | Mastra / eve | ~~skips handshake~~ **fixed**: full lifecycle + session + `isError`; breadth (resources/prompts) remains |
| 10 | Safety & sandboxing honesty | = / ▲ | Mithril | Neither ships a safe in-proc sandbox; Mithril refuses to fake one |
| 11 | Distribution & DX (channels/deploy) | ▼ | eve / Mastra | No channels, no deploy, no runtime CLI |
| 11b | Ejectability / breaking-change risk | ▲ | Mithril | Small pkgs, zero-dep core, one stable contract |
| 12 | Type discipline (from the code) | ▲ | Mithril | Strictest flags; zero `any`, zero suppressions verified tree-wide |
| 13 | Correctness CI gating | ▲ | Mithril | ~~only docs deploy~~ **fixed**: `ci.yml` gates push/PR on test + typecheck + browser-safe |

---

## 4. Dimension deep-dives (the load-bearing ones)

### 4.1 Runtime portability — Mithril's clearest moat (▲)

A static gate (`scripts/check-browser-safe.ts`) bundles **every** browser-declared entrypoint and
fails on any statically-reachable `node:`/`bun:` import. Node-only code lives behind dynamic
`await import()` or `*-node`/`*/server` subpaths. The full loop runs in the `runner-web` worker; each
state interface ships a browser-durable adapter (IndexedDB KV, OPFS FS).

- **LangGraph.js** — compute graph runs in-browser (`web.ts`, `MemorySaver`), but **every durable
  saver is Node-only** (`better-sqlite3`, `pg`). "Runs everywhere" is true for compute, **false for
  durability** — the part that matters.
- **Mastra** — Node ≥22.13 hard (`engines`), pulls `execa`/`ws`; browser = REST client only.
- **AI SDK** — Edge-first, Bun public-beta, no static browser-safe invariant.
- **eve** — Node ≥24, server-centric (Nitro); browser = client.

> **Verdict:** the only framework where both loop and durable state run in the browser, and the only
> one that mechanically enforces it. A genuine, defensible moat — protect it.

### 4.2 Durability & resume — the highest-value gap (▼)

Here the honesty cuts the other way. **LangGraph is the reference implementation and Mithril is
materially behind on depth.**

- **LangGraph.js** — checkpoint at **every superstep**; versioned checkpoints
  (`channel_versions` + `versions_seen`) make re-trigger deterministic; three durability modes
  (sync/async/exit); intermediate task writes persisted **as progress is made** (`putWrites`) so a
  mid-superstep crash loses no completed sibling work; subgraph-aware time-travel.
- **eve** — event-log replay: step-boundary checkpoints, completed steps replayed (never re-run),
  **versioned snapshots + explicit migrators**; honest at-least-once semantics.
- **Mastra** — snapshot-per-step with a `lastPersistedStatusByRun` guard so a `running` write can't
  clobber a `suspended` one; default engine is process-local.
- **Mithril** — checkpoints **only at terminal/suspend boundaries**: a single `persistResult` after
  `runCore` ([`loop.ts:365`](../../packages/core/src/agent/loop.ts), `374`). A mid-step crash loses
  all progress since the last boundary. The cross-process `ifParent` guard is a **check-then-act
  TOCTOU** — `latest()` SELECT then a separate `INSERT OR IGNORE`, no transaction, and the only
  UNIQUE constraint is `(run_id, checkpoint_id)`, **not** the parent chain
  ([`memory/src/sqlite-bun.ts:58-67`](../../packages/memory/src/sqlite-bun.ts)) — so two processes
  resuming one `runId` can both pass the check and **silently fork the chain**. Resume is
  at-least-once with no compare-and-swap dedup. On the plus side: the checkpointer contract is clean,
  each `put` is atomic *within one process* and fully parameterized, and `resumeFrom` continues the
  **same** `runId` with no manual token handling.
- **AI SDK** — no durable execution in core; outsourced to `DurableAgent`/Workflow SDK; HITL rides
  the live stream.

> **Verdict:** behind LangGraph/eve/Mastra, ahead of AI SDK. Closing this — per-step checkpointing,
> an atomic CAS on the parent chain (WAL + `busy_timeout` + a real uniqueness constraint), and
> versioned migrators — is the single highest-value *reliability* investment.

### 4.3 Human-in-the-loop — structurally safer than LangGraph (▲ safety / ▼ richness)

- **LangGraph** — `interrupt()` **throws** `GraphInterrupt`; on resume the **entire node re-runs
  from the top**, double-firing any pre-interrupt side effect; resume values match **positionally**.
  A stray `try/catch` breaks HITL. The field's biggest DX footgun.
- **Mithril** — suspend is a **typed event / return**, not a thrown exception. Three tiers wired
  (approval, tool-returned `suspend`, `ctx.suspend()` mid-execute with journal+replay); a dedicated
  `SuspendSignal` class (not a plain `Error`) so an over-broad user `catch` won't swallow it
  ([`loop.ts:165`](../../packages/core/src/agent/loop.ts)); nested-`asTool` resumes through the
  parent's own token; `ApprovalDecision.message` is **required**. Resume avoids LangGraph's
  re-execution bug class by design. **Already shipped** (verified): a single generic
  `SuspensionRequest` pause value *and* input-aware `needsApproval(input, ctx)` predicates.
- **eve** — the richest model: approvals + agent-asked questions unified under **one durable
  pause/resume** (`input.requested → session.waiting`), typed `ApprovalContext<TInput>` with **caller
  lineage** (`session.auth.current` vs `initiator`), parks with zero compute, renders natively per
  channel.

> **Verdict:** ahead on safety, behind on richness. The only defensible increment (verified) is
> optional **caller/initiator lineage** on the approval seam — small, and it composes with the
> already-shipped generic suspension. Everything else eve does here, Mithril already has the bones for.

### 4.4 Streaming, structured output & self-correction (= / ▲)

- **Self-correction is a Mithril battery no competitor ships.** The default `healing` stack
  ([`agent/healing.ts`](../../packages/core/src/agent/healing.ts)) is five composable middleware:
  `argRepair` (coerce a stringified-JSON args object), `harmonyRepair` (salvage a tool call that
  leaked into assistant *text* across harmony/Hermes/Qwen grammars — only for tool names the agent
  actually exposes, so prose is never mis-salvaged), `loopGuard` (steer at 3, halt at 4 identical
  calls), `retryBudget` (halt with `TOOL_REPAIR_EXHAUSTED` instead of burning to `maxSteps`), and
  `outputRetry` (re-ask on schema-invalid output). All emit **replayable events**
  (`tool.repair`/`tool.retry`/`loop.detected`/`object.invalid`) — self-correction you can *see* and
  *test*, and swap without loop surgery. This is the direct product of the repo's own
  self-correction research and is a real differentiator, especially for small/local models.
- **AI SDK** sets the bar on *defensive tool-call parsing*: empty-arg→`{}` coercion, typed
  `NoSuchToolError`/`InvalidToolInputError`, optional `experimental_repairToolCall`, and a
  **non-throwing `invalid:true` fallback**. Mithril already has typed unknown-tool and invalid-input
  errors and `argRepair`; the one worth mirroring is **empty-arg coercion at the parse boundary**.
- **Crash-hardening is a loop invariant, not a stack** — a throwing provider, middleware, or tool
  degrades to a typed `run.error`, never a process crash, even with `healing:false`
  ([`loop.ts:885-899`](../../packages/core/src/agent/loop.ts), `663-666`). Provider mid-stream
  failures are wrapped as retryable `PROVIDER_ERROR`; a pending abort is rethrown untouched so the
  run reports `cancelled` ([`loop.ts:769-772`](../../packages/core/src/agent/loop.ts)).
- **Structured output:** no framework ships native grammar-constrained decoding — all five
  validate-then-(optionally)-repair. Mithril already exposes the typed *capability* flags
  (`strictTools`, `constrainedDecoding`) as advisory signals; decode-time enforcement is correctly
  Roadmap.

> **Verdict:** at-parity on streaming, **ahead on self-correction**, tied on hard structured-output
> guarantees. Mirror AI SDK's empty-arg coercion; keep the healing stack front-and-center in
> marketing — it's underexposed.

> **Parallelism (▲ as of 2026-07-25):** a turn's independent tool calls now execute in a
> bounded-concurrency pool (`maxConcurrentTools`, default 8) with ordered commit — the sequential
> `for`-await is gone. Approval is a pre-execution barrier and mid-tool suspensions form a second
> barrier, so HITL semantics are unchanged (verified by test). This matches AI SDK's parallel
> tool-calls and adds deterministic ordering on top.

### 4.5 Memory / RAG / vectors — the biggest *battery* gap (▼)

- **Mastra** — resource/thread model, working memory + **semantic recall** (embedding retrieval),
  full RAG (recursive/sliding-window chunking, `embedMany`, pluggable pgvector/Pinecone/Qdrant),
  reranking, graph-RAG.
- **Mithril** — ships `VectorStore` (memory / sqlite-bun / sqlite-node) with a conformance kit, but
  **all search is brute-force full-scan cosine in JS** with per-row `JSON.parse`
  ([`vectors/src/sqlite-bun.ts`](../../packages/vectors/src/sqlite-bun.ts)) — O(n·d) + full
  deserialization per query, fine to ~10⁴ vectors, no further. **No ANN backend** (roadmap), **no
  dimension validation** (`Math.min(a.length, b.length)` → silent garbage on mismatch), and **no
  thread / semantic-recall / working-memory layer at all** — `@mithril/memory` is *checkpointers
  only*.

> **Verdict:** well behind Mastra. A browser-safe memory battery (threads/resources + working memory
> + semantic recall) is the most visible hole.

### 4.6 Provider coverage, MCP, OTel, sandbox (condensed)

- **Multimodal (▲ as of 2026-07-25):** `user` messages now carry `text`/`image`/`file` parts
  (URL, base64, or raw `Uint8Array` → normalized to JSON-safe `data:` URLs), mapped to each provider's
  native shape ([`core/src/protocol/content.ts`](../../packages/core/src/protocol/content.ts) +
  provider body builders). Closes a table-stakes gap with AI SDK/Mastra/eve while keeping the
  reducer's state string-typed via a boundary `ModelMessage`.
- **Providers (▼ breadth / ▲ integrity):** 4 hand-written adapters (OpenAI/Anthropic/Google/
  Transformers-on-device) vs AI SDK's ~30. But tested against **real SSE parsers via an injected
  `RuntimeAdapter.fetch`, zero mocking** — the right pattern. The SSE parser is robust (streaming
  multi-byte decode, `\n\n` framing with residual buffer, malformed-frame skip, `[DONE]`,
  `releaseLock` in `finally`). **Two concrete gaps:** (a) **no retry/backoff anywhere** — a `429`/
  `503` throws on the first response with no `Retry-After` awareness (grep confirms zero retry logic
  in `packages/providers/src`); (b) **cost is never computed** — every provider hardcodes
  `costMicroUsd: 0` ([`openai/stream.ts:25`](../../packages/providers/src/openai/stream.ts) et al.),
  so the loop's `maxCostMicroUsd` budget is **silently inert**.
- **MCP (▲ as of 2026-07-25):** ships client + server + Streamable-HTTP transport, tested end-to-end
  zero-network. The client now runs the full **`initialize` → `notifications/initialized` handshake**
  (lazy, once, concurrency-safe), negotiates and exposes `protocolVersion`/`capabilities`/`serverInfo`,
  captures and echoes the server-assigned **`Mcp-Session-Id`**, pages `tools/list`, prefers
  `structuredContent`, and **throws a typed `McpError` on `isError`** — the fail-loud fix
  ([`mcp/src/index.ts`](../../packages/mcp/src/index.ts)). This is now at-or-ahead of the field on
  protocol correctness; the remaining gap vs Mastra/eve is *breadth* (resources/prompts, OAuth).
- **OTel (▲ architecture / ▼ conformance):** a dependency-free fold into an
  `invoke_agent > chat > execute_tool` span tree that *cannot desync* — but it diverges from gen_ai
  semconv (`gen_ai.span.kind` instead of `gen_ai.operation.name`, no `gen_ai.system`, no token
  attributes) and ships no `@opentelemetry/api` adapter.
- **Sandbox (= / ▲ honesty):** `nodeVmRunner` is **loudly documented as an isolation boundary, NOT a
  security boundary**. No safe in-process backend exists (WASM/QuickJS is roadmap); untrusted code's
  only safe path is `remoteRunner`. Unlike eve — whose `just-bash` fallback silently downgrades to
  *no* isolation by availability — Mithril refuses to pretend. FS adapters enforce a rooted
  `..`-traversal confinement, tested against real disk.

### 4.7 Type discipline & CI (▲ types / ▼ gating)

`tsconfig.base.json` enables `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` +
`noPropertyAccessFromIndexSignature` + more; the tree has **zero `any`, zero `@ts-ignore`, zero
lint-disable, one justified non-null assertion**. Strictest in the set. ~~The only CI workflow is
`deploy-docs.yml`.~~ **Fixed 2026-07-25:** [`ci.yml`](../../.github/workflows/ci.yml) now gates every
push/PR on `bun test` + `bun run typecheck` + `bun run check:browser-safe`, so the strong local
discipline is finally enforced.

---

## 5. What Mithril should steal (per competitor)

- **From eve:** model durability as an explicit **step-boundary replay engine** with versioned
  snapshots + migrators; **caller/initiator lineage** on approvals; keep durability/sandbox behind
  stable typed interfaces (don't couple the public contract to a pinned engine). *Avoid* its
  insecure-permissive defaults and silent sandbox downgrade.
- **From LangGraph:** match durability *depth* (in-order async persistence, progress-preserving
  intermediate writes, subgraph-aware replay); ship an explicit **durability-mode knob**
  (sync/async/exit); ship checkpoint **retention/pruning** as a first-class concern. *Avoid* the
  error-as-control-flow interrupt and the multi-generation state-schema sprawl (Mithril already does).
- **From Mastra:** the **memory battery** (resource/thread + semantic recall + working memory) and a
  **RAG package**; live-sampling evals attachable to steps. *Avoid* baking analytics into core and
  the heavy AI-SDK-coupled dependency surface.
- **From Vercel AI SDK:** compose over the `LanguageModelV3` provider spec (or ship an adapter) to
  inherit ~30 providers instead of hand-maintaining them; mirror **empty-arg coercion** + a
  **`Retry-After`-aware retry posture**; speak the **UI Message Stream** wire format (or a bridge) to
  inherit the `useChat` ecosystem. *Avoid* the 6-major churn — lead with Mithril's one stable contract.

---

## 6. Prioritized improvement opportunities

Ranked by (impact × low-effort × fit-to-identity). "Verified" = confirmed against source by the
adversarial pass. **★ = new finding from the first-hand core/provider read** (not in the original
generated list). Effort/impact are the verifiers' calibrated values.

| # | Opportunity | Impact | Effort | Status | Touches |
|--:|---|:--:|:--:|---|---|
| 1 ★ | **Wire correctness CI** — gate push/PR on `bun test` + `typecheck` + `check:browser-safe` | High | Low | ✅ **shipped** | `.github/workflows/ci.yml` |
| 2 | **Provider-agnostic memory battery** (threads/resources + working memory + semantic recall) | High | High | confirmed-gap | new `@mithril/memory/threads` |
| 3 | **Atomic cross-process checkpoint guard** — fix the `ifParent` TOCTOU (WAL + `busy_timeout` + parent-chain UNIQUE) | High | Low | confirmed-gap | `@mithril/memory` sqlite backends |
| 4 | **Header-aware HTTP retry/backoff** in providers (429/5xx + `Retry-After`, jittered, capped) | Med | Low | confirmed-gap | `@mithril/providers` shared helper |
| 5 ★ | **Populate cost** (pricing table → `costMicroUsd`) so `maxCostMicroUsd` stops being inert | Med | Low | New gap | providers + usage mapping |
| 6 | **Complete the MCP client** — `initialize` handshake, session capture, `isError` propagation | Med | Low | ✅ **shipped** | `@mithril/mcp` |
| 7 | **gen_ai-semconv-conformant OTel** + a real `@opentelemetry/api` adapter | Med | Med | confirmed-gap | `@mithril/otel` |
| 8 | **Channel/adapter layer** (Slack/Discord/HTTP ingress+egress) that renders HITL natively | High | High | confirmed-gap | new `@mithril/channels` |
| 9 | **Per-step checkpointing + `durability: boundary\|step\|async` knob** | High | High | confirmed-gap | core loop + `Persistence` |
| 10 | **Browser-safe RAG package** (chunk → embed → retrieve) over the vector interface | High | High | confirmed-gap | new `@mithril/rag` |
| 11 ★ | **Parallel tool execution** — fan out independent calls (bounded pool, ordered commit) | Med | Med | ✅ **shipped** | core loop (`maxConcurrentTools`) |
| 12 ★ | **Multimodal message parts** — `text`/`image`/`file` parts across OpenAI/Anthropic/Google | Med | Med | ✅ **shipped** | `agent-types` + `content` + providers |
| 13 | **Vector dimension validation** (reject/normalize mismatched dims; ANN is already Roadmap) | Med | Low | partial | `@mithril/vectors` |
| 14 | **Typed `isolationLevel`** on sandbox results (honest, observable; WASM backend is Roadmap) | Med | Low | partial | `@mithril/sandbox` |
| 15 | **Broaden evals** to the real protocol surface, gate-vs-soft severity, non-self LLM judge | Med | Med | partial | promote `evals/` → `packages/evals` |
| 16 | **Empty-arg coercion** at the tool-call parse boundary (mirror AI SDK) | Low | Low | enhancement | core loop / healing |
| 17 | **Caller/initiator lineage** on the approval seam (the only non-shipped slice of eve's HITL) | Low | Low | partial | `protocol/tool.ts` |
| — | Constrained/grammar decoding for hard guarantees | Med | High | Roadmap (keep) | providers |

### The three "do-first" moves

- **#1 Correctness CI (High impact, Low effort).** Everything else on this list can regress silently
  until this exists. The local discipline is already excellent; make it *enforced*. This is the
  single highest ROI item and should land this week.
- **#3 Atomic checkpoint guard (High, Low).** The checkpointer's whole reason to exist is
  cross-process resume, and that is exactly the scenario the current guard races. A `PRAGMA
  journal_mode=WAL`, a `busy_timeout`, a UNIQUE constraint on `(run_id, parent_id)`, and a
  compare-and-swap `put` close it without changing the public contract.
- **#4 + #5 Provider hardening (Med, Low).** A `429` today is a terminal run failure; the cost budget
  today is a no-op. Both are small, self-contained, and remove two silent surprises.

---

## 7. Strategic recommendation

**Keep (the identity — it's exactly what every competitor sacrifices):**
protocol-first single event stream · zero-runtime-dep, browser-safe core · enforced runtime-agnosticism
· can't-desync observability · the self-healing stack · maximal type discipline · low breaking-change
risk · honest Roadmap.

**Close (reliability + correctness — mostly small, high-leverage):**
correctness CI (#1) · atomic checkpoint guard (#3) · provider retry + cost (#4, #5) · MCP correctness
(#6) · semconv OTel (#7) · per-step durability (#9) · parallel tools + multimodal (#11, #12).

**Add (the batteries that make it a *product*):**
the memory battery (#2) and RAG (#10) · and the biggest product gap — a **channels + deploy** story
(#8). These are the difference between "a beautifully engineered harness" and "a thing a team ships
on Monday."

The honest one-liner: **Mithril already wins the architecture argument. It now has to win the
batteries-and-durability argument without betraying the architecture** — and every item above is
scoped to do exactly that.

---

## Appendix — per-framework reliability posture (from the code)

- **LangGraph.js — most trustworthy on durability/fault-tolerance.** In-order async persistence,
  version-based deterministic resume, progress-preserving `putWrites`, subgraph-aware replay, a tiny
  saver interface *with a conformance suite*. Caveats: the `interrupt()` node-re-execution footgun
  (mitigated by the Functional API) and Node-only durable savers.
- **eve — most trustworthy full-stack durable runtime, with unusually honest docs** (at-least-once
  re-run, no FIFO queue, permissive defaults all stated plainly). Trust cost: pinned-beta coupling
  and silent sandbox downgrade.
- **Vercel AI SDK — most trustworthy provider/tool-call layer** (defensive parse state machine,
  header-aware retry, typed errors), least trustworthy *as a harness* (no core durability, 6-major
  churn).
- **Mastra — trustworthy single-server** (status-guarded snapshots, structured retry with
  `MastraNonRetryableError`), with a heavy, Node-locked, AI-SDK-coupled core and analytics baked in.
- **Mithril — trustworthy contract with strong type/test discipline, thin on adversarial edges.**
  Suite green; every durable backend re-runs the in-memory conformance kit; providers tested against
  real SSE with no mocking; FS confinement tested against real disk. The gaps are **process and
  edge**: no correctness CI, the TOCTOU checkpoint guard, at-least-once resume with no dedup, coarse
  suspend-only durability, an inert cost budget, and conformance kits that don't yet exercise
  concurrent `ifParent` contention, double-resume, or dimension mismatch.

### Sources

Mithril: first-hand read of `packages/*/src` (loop, healing, providers, memory, kv, fs, vectors,
mcp, otel, sandbox, spec) + `tsconfig.base.json` + `.github/workflows/`. Competitors: `vercel/ai`
(`packages/ai`, `packages/provider`) + ai-sdk.dev; `mastra-ai/mastra` (`packages/core`) + mastra.ai;
`langchain-ai/langgraphjs` (`libs/langgraph`, `libs/checkpoint*`) + langchain docs; `vercel/eve`
(`packages/eve`) + eve.dev/docs. Full per-agent findings and the adversarial verdicts are archived in
this session's workflow transcript.
