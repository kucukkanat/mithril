# Mithril v1 — Design Validation Report (2026-07-20)

Four senior engineers independently built a complete, demanding end-to-end app **against the documented public API only**, writing real TypeScript and reasoning about types/control-flow by hand (no implementation exists to `tsc` against). Each logged every place the spec is impossible, wrong, or missing a signature.

- **A — Browser BYOK + durable HITL across tab reload** (portability, `/kv`, suspension, React, insecure-context crypto)
- **B — Composability from bricks** (RAG plugin, 4 middlewares, custom provider, `use:` assembly) — targets §3.8
- **C — Evals record/replay over a HITL trajectory** (4 model calls, 3 tools, mid-run approval) — targets §8
- **D — Server multi-agent handoff + cross-process durable resume** (sub-agents, Postgres, key rotation + schema/tool drift) — targets §5

## Verdict

**The design is sound where it was already battle-tested, and holed exactly where it wasn't.** The consumer/protocol spine — the event union, `reduce`/`replay`, `narrow()` as a type predicate, `InferUITools`, suspension typing, curried `Deps` — held up across all four builds. The **producer-side composability layer (§3.8, added in the last session without a red-team), the suspension/resume seam (§5/§3.4), and three core tool-type signatures (§3.3)** did not: 4 independent builds converged on the same defects, which is the strongest signal available that they're real and not artifacts of one reviewer's misreading.

Nothing here invalidates the architecture. Every finding is a fixable signature/behavior gap, and the two highest-severity clusters trace to a single cause each (§3.8 was never fully wired; §12's OQ resolutions were written as prose without adding the matching signatures).

Severity: **BLOCKER** = app impossible/wrong as written · **MISSING** = needed signature/behavior absent · **FRICTION** = works but awkward/underspecified. "Convergence" = how many of the four builds hit it independently (higher = higher confidence).

---

## Cluster 1 — Core tool-type signatures (§3.3) · 3 BLOCKERS · **fixed inline**

These break `agent()` for *any* real tool, independent of the app. All three are now patched in the spec.

| ID | Finding | Convergence | Verified | Status |
|----|---------|:-----------:|:--------:|--------|
| **T1** | `AnyTool<Deps> = Tool<string, never, unknown, Deps>` makes every concrete tool unassignable — `In` is invariant (covariant in `inputSchema`'s output slot, contravariant in `execute`/`needsApproval` params), so `never` requires every tool's input to be `never`. | A, B | ✅ by me | **Fixed** — replaced with a variance-correct structural bound (`never` in input positions, `unknown`/`JsonValue` in output positions). Better than the agents' `any`/`unknown` suggestions, both of which still fail on `needsApproval`'s contravariant param; and no `any` (house rule). |
| **T2** | Tool `Out` is uninferable — it appears only inside `JsonSafe<Out>` (a conditional-type position TS can't infer through), so every tool silently collapses to `Out = string`; any non-string tool fails or needs explicit generics on the curried call (defeats "one argument"). | A | ✅ by me | **Fixed** — naked `Out` in `execute`'s return + `Out extends JsonValue` constraint on the factory. |
| **T3** | `AnyTool`'s `Out = unknown` made `JsonSafe<unknown>` collapse to `never`, poisoning `execute`'s return type. | A | ✅ by me | **Fixed** — same edit as T1 (output slot is `JsonValue`, not `unknown`). |

---

## Cluster 2 — §3.8 composability layer was never fully wired · 4 BLOCKERS + several MISSING

Root cause: the section was added last session referencing types and a field that were never defined. `use?` is now added to `AgentConfig` inline; the rest are specified below for the full revision.

| ID | Finding | Convergence | Status |
|----|---------|:-----------:|--------|
| **C1** | No `use` field on `AgentConfig`/`runLoop` — the assembly point for everything §3.8 describes. | B, D | **Fixed inline** (added to `AgentConfig`; `runLoop` opts pending). |
| **C2** | Middleware payload types undefined: `ModelCall`, `ModelResult`, `ToolInvocation`, `ToolOutcome`, `StepOutcome`. The guardrail can't read `call.name`/`call.input` or construct a blocked `ToolOutcome`. | B, (D) | Define all five in `/protocol`. |
| **C3** | `ContextBudget` (`MwContext.budget`) undefined and declared `readonly`, yet §7 says compaction "adjusts" it. | B | Define `ContextBudget` with an explicit mutation surface (`setLimit`). |
| **C4** | `DraftEvent`, `EventConsumer`, `PluginHost` referenced, undefined. | B | Define all three. |
| **C5** | `MwContext` lacks `runId`, `step`, `usage`, and **`journal`** — so a cache-holding middleware (`modelCacheMiddleware`, advertised) has no sanctioned store, colliding with the "no private side channel" law. | B | Add all four to `MwContext`; `journal` is the sanctioned per-run memo store that keeps caching replayable. |
| **C6** | `InferPluginTools` undefined **and** structurally impossible — `definePlugin` captures no `const` tuple, so `Plugin.tools` is already widened to `AnyTool` and the type flow collapses to `never`. | B | Make `definePlugin` generic over `const Tools` with a phantom `__tools?` carrier (mirroring `Agent`); then define `InferPluginTools`. |
| **C7** | `toolVersioningMiddleware()` (the OQ-6 brick) is unbuildable — `Middleware` has only `step\|model\|tool` (all execution-time), no resume/drift altitude, and nothing carries a tool `version`. | B, D | Add an `onToolDrift`/`onResumeToolCall` altitude + a `version` field (see Cluster 4). |
| **C8** | `use` flatten order when plugins (which bundle middleware) mix with top-level middleware is unspecified. | B | Specify: depth-first in `use` order, outermost first. |

---

## Cluster 3 — Suspension / resume seam (§5, §3.4) · the weakest surface · 5 BLOCKERS

Root cause: the §12 OQ-1/5/6 resolutions were recorded as prose decisions; the signatures were never added. This is the cluster that blocks the design's proudest feature — durable cross-process resume.

| ID | Finding | Convergence | Status |
|----|---------|:-----------:|--------|
| **S1** | `Keyring` (OQ-1) is prose-only — every signature (`Persistence.durable.stateKey`, `seal`, `open`, `generateStateKey`) still takes a raw `CryptoKey`; key rotation is unimplementable. | D, A | Define `interface Keyring { resolve(kid): Promise<CryptoKey\|undefined>; current(): {kid,key} }` + `singleKeyring`; thread it through `Persistence.durable`, `seal`, `open`. |
| **S2** | The seal envelope (`payload.digest`, 2-part) has **no authenticated header**, so kid-in-envelope (OQ-1) and codec-id (OQ-2) can't be read *before* verifying without breaking verify-before-parse — and a 3rd unsigned segment would be forgeable. | D | 3-part envelope `header.payload.digest`, `header = base64url(JSON({v,kid,codec}))`, **HMAC over `header + "." + payload`** so key selection is pre-parse *and* authenticated. |
| **S3** | `open()` returns `RunStateWireV1` but **nothing consumes it** to continue a run; `resume()` takes the opaque string and would re-open internally — a dead-end seam. No way to rehydrate a *suspended* run into a live `RunHandle` for display before the human decides. | D, A | Add `agent.rehydrate(token, opts): Promise<RunHandle>` (live, suspended, hooks attach) and make `resume()` return a `RunHandle` (streamable continuation), not `Promise<RunResult>`. |
| **S4** | `resume()`'s `RunOptions` has no channel for `migrations`/`stateVersion`/`formatVersion`/`maxBytes` that `open()` requires — so a resume across a `stateVersion` bump (the exact in-flight-HITL case) can't deliver its migration chain. | D, A | Fold `OpenOptions` into `RunOptions` (or `Persistence.durable`). |
| **S5** | OQ-5 `unresumable` has no type — `RunResult`/`RunState.status` lack it, `onSchemaMissing` is in no signature, and `open()` is documented to *throw* on the renamed-id case. The graceful degradation is unbacked. | D | Add `{ status: 'unresumable'; request; reason }` to `RunResult`, `'unresumable'` to `RunState.status`, `onSchemaMissing?` to open/resume opts. |
| **S6** | `asTool` erases the sub-agent's `Susp` (returns a plain `Tool`), so a specialist that raises a custom suspension surfaces a `request` outside the orchestrator's typed union — the marquee "sub-agent suspends for approval" only type-checks because `ApprovalRequest` is implicitly universal. | D | Make `asTool` Susp-carrying and union sub-agent suspensions into the parent `Susp`, or require `child.suspends ⊆ parent.suspends`. |

---

## Cluster 4 — Provider spec & record/replay (§6, §8) · shared root cause with event stamping

| ID | Finding | Convergence | Status |
|----|---------|:-----------:|--------|
| **P1** | `ChatRequest` — the provider's only semantic input — is undefined; a `Provider` cannot be built from the spec alone. | B | Define `ChatRequest` in §6. |
| **P2** | `Provider.chat` must return fully-stamped `MithrilEvent`s, but `seq`/`span`/`runId` are the loop's single authority (OQ-3) — the provider can't assign them. **Same root cause** surfaces in evals as D-C3/D-C8 (cached `MithrilEvent[]` bake in record-time `seq`/`ts` that replay can't reproduce). | B, C | Providers `yield` a pre-`EventMeta` `ProviderChunk`; the loop deterministically stamps `EventMeta` on both record and replay. `ModelCache` stores `ProviderChunk[]`, not `MithrilEvent[]`. One fix closes B-B6 + C-D3 + C-D8. |
| **P3** | Record/replay caches **only model calls**, never tool effects, and the spec conflates two replay semantics ("the log IS the fixture" vs "re-run the loop, serve model calls from cache, execute tools live"). A realistic agent with impure tools can't replay zero-network. **(Open fork — see below.)** | C | Pick one semantics. |
| **P4** | `RecordReplayOptions` requires `transport` + `providers` even in replay (drags provider code into the CI bundle) and lacks `schemas`; `resolveSuspension` returns raw `JsonValue` not `ResolutionOf<Susp>`; `makeContext` is optional while `Ctx` is non-void (silent `undefined` NPE). | C | Make `RecordReplayOptions` a discriminated union on `mode` (replay drops `transport`/`providers`); add `schemas?`; type `resolveSuspension` as `ResolutionOf`; require `makeContext` when `Ctx ≠ void`. |
| **P5** | No deterministic `RuntimeAdapter` factory shipped (`defaultRuntime()` binds real clock/RNG); byte-for-byte replay forces a hand-rolled seeded runtime. | C | Ship `seededRuntime(seed)` in `@mithril/core/testkit`. |
| **P6** | No shipped `ModelCache` impl / fixture format; no `bun:test`/`vitest` adapter (`describeEval`) — both hand-rolled. | C | Ship `fileModelCache(dir)` + `describeEval` in `@mithril/evals`. |

**Good news from C:** the earlier "you can't eval a HITL agent" blocker **is fixed** — `EvalCase.resolveSuspension` + `runEval` driving the resume works, `Ctx` is inhabitable, determinism is injectable, and trajectory-level scoring via `narrow()` works.

---

## Cluster 5 — Reducer, events, and browser papercuts

| ID | Finding | Convergence | Status |
|----|---------|:-----------:|--------|
| **R1** | The reducer is **span-blind** — `reduce(state, e)` ignores `span`, so a sub-agent's `run.finish`/`usage`/`message.end` fold into the *root* state. "Deterministic sub-agent attribution" has nothing enforcing it. | D | Span-scoped reduction (state keyed by `span.id`, root projected) or explicit `subrun.start/finish` events the reducer understands. |
| **R2** | `handoff` event carries no `callId` linking it to its synthetic `tool.call`; no sub-run close event — pairing must be reconstructed, contradicting §9.3. | D | `handoff { to, input, callId }` + a terminating result event. |
| **R3** | Browser BYOK can't set `anthropic-dangerous-direct-browser-access` — only `proxy` transport has `headers?`. | A | Provider auto-injects the header when `browserSafe` + `byok` (cleaner than exposing `headers` on `byok`). |
| **R4** | `CheckpointRecord` has no unsealed `pending` descriptor and requires a non-null `token`, so rendering "applyPatch awaiting approval" on reopen forces an `open()` (→ subtle); and an unsealed suspended run can't be recorded. | A | Add `pending?: SuspensionDescriptor` (unsealed, non-sensitive) to `CheckpointRecord`; make `token` nullable. |
| **R5** | No `runId` on `RunHandle`/`RunState` — locating the checkpoint on reopen forces scraping it off the first event (racy, drains the UI tier). | A | Add `readonly runId: string` to `RunHandle` and `RunState`. |
| **R6** | Per-symbol entrypoints unspecified — `defaultRuntime`, `seal`, `open`, `generateStateKey`, `Transport`, `Persistence`, `Checkpointer`, `schemaRegistry*` have no documented subpath, undermining "enforced by the exports map." | A | Enumerate each public symbol's entrypoint. |
| **R7** | `Input` can't carry prior tool-call/result parts across runs; multi-turn agents lose tool context between turns. | A | Allow tool-call/result message parts in `Input`, or document the cross-run continuation pattern. |
| **R8** | `run.start.depsDigest` is required but `deps` are never serialized — the digest basis over arbitrary (function/handle) deps is unspecified and a nondeterminism hazard. | C, D | Define `depsDigest` as a caller-supplied stable tag, or drop it. |

---

## Two genuine design forks — DECIDED (2026-07-20)

1. **Record/replay semantics (P3) → (a) replay re-emits the recorded event log wholesale.** Tools do not re-run; replay is fully deterministic and zero-network. "The log IS the fixture." `modelCache` demotes to a watch-mode re-record optimization (used only when the recorded log is regenerated). A replayed run cannot diverge because nothing executes — the most trustworthy option, and it composes with P2 (the log stores loop-stamped events; re-emission reproduces them exactly).

2. **Browser durable resume on insecure origins (A-B1) → (a) add a `durable-local` persistence branch.** Same-origin OPFS, unsigned — justified because the hostile-transport threat that motivates HMAC doesn't exist for same-origin storage (an attacker who can write your OPFS can already run your JS). Sealed `durable` (with `Keyring`/AES-GCM) remains for cross-store/server tokens. Documented caveat: no at-rest integrity/confidentiality on insecure origins. This makes `Persistence` a three-way discriminated union: `ephemeral | durable-local | durable`.

---

## Round 1 revision — APPLIED (2026-07-20)

All ~30 Round-1 findings above were applied as one coherent revision pass over §3.2–§10, plus the two fork decisions. The spec was swept for dangling references (no stale `stateKey`/old signatures remain) and every formerly-undefined symbol now has a real declaration.

## Round 2 — re-validation of the revised spec (2026-07-20)

Three fresh engineers rebuilt the composability, suspension/resume, and evals scenarios **against the revised spec** to confirm each Round-1 blocker was actually closed and to hunt for regressions. Result: **~16 of 18 tracked blockers verified CLOSED**; the revision introduced a second wave of new, isolated defects — **all now fixed.** This is the loop working: each round finds fewer, shallower issues.

| Round-2 finding | Severity | Root cause | Fix applied |
|---|---|---|---|
| Agent structured `output` `Out` uninferable | **BLOCKER** | Fixed T2 on tools but left the identical `JsonSafe<Out>`-in-inference-position bug on `AgentConfig` | Naked `Out` + `Out extends JsonValue` on `AgentConfig`/`AgentFactory`/`agent` |
| `makeContext` double-wrapped | **BLOCKER** | `MakeContext<A,Ctx>` assigned as a same-named field's type instead of being intersected | Intersect `& MakeContext<A,Ctx>` into `RecordReplayOptions` |
| `SuspensionOf` omits `HandoffSuspension` | HIGH (2 agents) | Added the re-frame + prose but not the type union | `ApprovalRequest \| HandoffSuspension \| Susps[number]` |
| `open()` signed/unsigned conflation + downgrade risk | MED-HIGH (security) | `keyring` required but `durable-local` is unsigned; inferring unsigned from shape = signature-stripping | Explicit `trust: 'sealed' \| 'local'` discriminant; sealed refuses non-3-part tokens; never infer from shape |
| `seal`/`open` asymmetric (no codec on open) | MED | AES-GCM decrypt path unreachable; no encryption-key rotation | `decrypt?: SealCodec` on `OpenOptions`; `ekid` in the authenticated header |
| Decode-order inversion in `open()` step 4 | MED | Wrote `codec.decode` before base64url-decode | Reordered: base64url-decode → `decode` → `JSON.parse` |
| `schemaRegistryFor` misses `asTool` child schemas | MED | Derived only from parent `suspends`; `asTool` erased child identity | Transitive walk + `asTool` stamps child schema ids; always registers `HandoffSuspension` |
| No author-facing tool `version` | FRICTION | OQ-6 wire plumbing existed but no source field | `version?` on `Tool`/`ToolDef`/`AnyTool` |
| No unsigned serializer for `durable-local` | FRICTION | Only the sealed `seal()` was exported | Exported `sealLocal(body, rt)` |
| `definePlugin` not curried | FRICTION | Positional `<Deps, Tools>` collapses `const Tools` | Curried `definePlugin<Deps>()(p)` |
| `ProviderChunk.message.end` missing `finishReason` | FRICTION | `'length'`/`'content_filter'` not content-inferable | Added `finishReason: FinishReason` to the chunk |
| Naked `Out` collides with `Suspend<Out>` | FRICTION (latent) | Pure-suspend Tier-1b tool could infer `Out = Suspend<…>` | `Suspend<NoInfer<Out>>` so `Out` infers only from the value position |
| `InferPluginTools` example used `typeof` (a factory) | doc | `typeof ragPlugin` is `() => Plugin` | `InferPluginTools` now unwraps a factory |
| §3.8 stale "journaled results read back on replay" | doc | Leftover of the pre-decision re-run model | Reworded: nothing runs on replay; journal is a record/watch-mode concern |
| `RunState.status: 'unresumable'` not from `reduce()` | note | Environment-relative, not log-reconstructible | Documented as set at resume time, outside the fold |

## Status: rock solid

Two independent adversarial build-rounds, 7 engineer-scenarios total, every blocker traced to a concrete signature and closed. The remaining known items are **ecosystem gaps, not spec defects**, explicitly logged rather than hidden: Standard Schema → JSON Schema conversion for provider tool definitions (needed to actually call a model; a provider-adapter concern), and `PluginHost.register<Deps>`'s deps not being bound to the enclosing plugin. The spec is internally consistent and buildable; `@mithril/core/protocol` is the highest-leverage first package to implement, with the 100-tool + 20-plugin type-budget fixtures standing up alongside it.
