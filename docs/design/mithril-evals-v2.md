# Mithril evals v2 — design spec

**Status:** proposed (spec only; no implementation). **Scope:** Tier 1 + Tier 2 of the eval-framework
improvement plan. **Centerpiece decision (locked):** trajectory assertions are anchored on an
AgentEvals-style **reference matcher** (`strict | unordered | superset | subset`), complemented by
composable per-event primitives.

This document is the actionable plan derived from a comparison of `@mithril/evals` against the best
agent-eval frameworks in the field (Inspect AI, LangChain AgentEvals/OpenEvals, Braintrust; secondary:
DeepEval, Mastra, Promptfoo/Evalite). It respects the repo constitution: **zero new runtime deps in
core**, ESM-only, strict TS (no `any`, no non-null `!`), Bun runtime/test-runner, design tokens for any
UI, tests for everything, conventional commits, and the **docs-lockstep prime directive** (every public
API change ships its TSDoc + regenerated reference + guide/playground updates in the same commit).

---

## 0. Why (one paragraph)

Our differentiator — the recorded `MithrilEvent` log genuinely *is* the fixture, scored by pure
functions — is real and, today, under-exploited. The field has three things we lack that are table
stakes for an *agent* eval tool: **stochastic trials / pass@k** (agents are non-deterministic; a
one-shot score is noise), **concurrency** (we run cases sequentially), and a **CLI + watch +
baseline-diff loop**. Separately, the event log already carries `handoff`, `tool.approval` / `suspend`
/ `resume`, `tool.repair` / `tool.retry`, `object.final`, `reasoning.delta`, and a full **span tree**
that no built-in scorer touches — assertions no input/output-pair framework can express. v2 closes the
gaps and turns the under-used richness into shipped scorers, while keeping our existing wins
(record/replay, `trajectoryToScript`, self-contained `htmlReport`, typed `calledToolWith`, and the
`@mithril/devtools` inspector we already own).

---

## 1. Data-model changes (`packages/evals/src/index.ts`)

### 1.1 `Score` — allow skip + structured metadata

```ts
export interface Score {
  readonly name: string;
  readonly value: number | null;      // null = N/A / skip → excluded from aggregates & pass/fail
  readonly rationale?: string;
  readonly metadata?: JsonValue;       // structured detail, e.g. { expected, actual, mode }
}

// A scorer may now return one score, several named scores, a bare number, or null.
export type ScorerResult = Score | readonly Score[] | number | null;
```

Rationale: `null` (Braintrust) lets a conditional scorer opt out of a case without polluting the
aggregate (e.g. "only grade hallucination when the turn produced text, not a tool call"). `metadata`
(Inspect `Score.metadata`) carries the machine-readable `expected/actual` that the report and diff
render, instead of stuffing everything into free-text `rationale`.

### 1.2 `EvalCase` — first-class golden + per-case knobs (additive, non-breaking)

```ts
export interface EvalCase<Ctx = void, Expected = unknown> {
  readonly name: string;
  readonly input: Input;
  readonly scorers: readonly Scorer<Ctx, Expected>[];
  readonly expected?: Expected;                 // golden — reaches scorers without a closure
  readonly reference?: ReferenceTrajectory;     // golden tool-call sequence for matchesTrajectory
  readonly tags?: readonly string[];            // filtering / grouped metrics
  readonly trials?: number;                     // per-case override of the run-level trials
  readonly meta?: JsonValue;
}
```

Today a golden must be closed over when constructing a bespoke scorer (`makeContext` is *global*, not
per-case). `expected` on the case matches every serious framework (Inspect `target`, Braintrust
`expected`, DeepEval golden) and is the input the reference matcher and reference-based judge consume.

### 1.3 **Decision needed — the `Scorer` signature**

`expected` must reach scorers. Two shapes:

- **Option A (non-breaking): evolve the context.** Keep `(t, ctx) => ScorerResult`; make `makeContext`
  receive the case so `expected`/`meta`/`trialIndex` can be surfaced into `Ctx`. Built-ins keep
  `(t) => …`. Cost: `expected` isn't automatically present; each eval wires it through `makeContext`.

- **Option B (breaking, recommended): single args object.**
  ```ts
  export interface ScorerArgs<Ctx, Expected> {
    readonly trajectory: Trajectory;
    readonly expected?: Expected;
    readonly meta?: JsonValue;
    readonly trialIndex: number;
    readonly ctx: Ctx;
  }
  export type Scorer<Ctx = void, Expected = unknown> =
    (args: ScorerArgs<Ctx, Expected>) => ScorerResult | Promise<ScorerResult>;
  ```
  Matches Braintrust (`{ input, output, expected, metadata }`) and Inspect (`score(state, target)`).
  `expected`/`trialIndex` are always present; cleaner long-term. Cost: every built-in and every user
  scorer changes from `(t) => …` to `({ trajectory }) => …`. We're `0.0.0`, so the blast radius is
  ours to absorb, and it's the central API — worth doing once, now.

**Recommendation: Option B.** Flagged as the single breaking change in v2; everything else is additive.
(This also lands cleanly with the pending breaking-change decisions already tracked for the DX effort.)

---

## 2. Reference trajectory matcher (Tier 1, centerpiece) — new module `packages/evals/src/trajectory.ts`

Steals the AgentEvals taxonomy, implemented over our event log; the one axis where our nearest TS
competitor currently beats us.

```ts
export type TrajectoryMatchMode = "strict" | "unordered" | "superset" | "subset";
export type ToolArgsMatchMode  = "exact" | "ignore" | "subset" | "superset";

export interface ReferenceStep { readonly tool: string; readonly input?: JsonValue; }
export type ReferenceTrajectory = readonly ReferenceStep[];

export interface MatchOptions {
  readonly mode?: TrajectoryMatchMode;           // default "superset"
  readonly toolArgs?: ToolArgsMatchMode;         // default "exact" when a ref step has input, else "ignore"
  readonly perTool?: Readonly<Record<string, (actual: JsonValue, reference: JsonValue) => boolean>>;
}

/** Score 1 iff the trajectory's tool-call sequence matches `reference` under `mode` (+ arg modes). */
export function matchesTrajectory(reference: ReferenceTrajectory, opts?: MatchOptions): Scorer;

/** Derive a ReferenceTrajectory from a recorded/expected run — record/replay fixtures become goldens. */
export function referenceFromTrajectory(t: Trajectory): ReferenceTrajectory;
```

**Semantics** (extract the ordered `tool.call` list `{name, input}` from `t.log`, compare to `reference`):

| mode | meaning |
|---|---|
| `strict` | same calls, same order, 1:1 (no extra, no missing) |
| `unordered` | same multiset of calls, any order |
| `superset` | actual ⊇ reference — reference appears as an ordered subsequence; extra calls allowed |
| `subset` | actual ⊆ reference — no call outside the reference set; agent may do fewer |

`toolArgs` is orthogonal: `exact` (deep-equal), `ignore` (name only), `subset`/`superset` (object
containment). `perTool` supplies a comparator for a specific tool (e.g. case-insensitive city).
`metadata` on the returned `Score` reports the first mismatch (expected vs actual) for the report/diff.

**Synergy:** `referenceFromTrajectory` turns an existing record/replay recording into the golden, so a
reviewed "known-good" run becomes the regression reference for free. The matcher stays tool-call-centric
(parity with the field); richer-event assertions live in §7 as separate primitives — deliberate
separation so the matcher is simple and predictable.

---

## 3. Trials + reducers + native pass@k (Tier 1) — `packages/evals/src/trials.ts`

The stochasticity primitive. The landscape's finding: **no TS/JS framework ships native pass@k as a
named metric** (Inspect has it only in Python). This is ours to own.

```ts
export type Reducer = "mean" | "median" | "mode" | "majority" | `pass@${number}` | `pass^${number}`;

export interface TrialOptions {
  readonly trials?: number;                        // default 1 (current behavior)
  readonly reducer?: Reducer | readonly Reducer[]; // default "mean"
}

// Per-scorer trial aggregate, attached to EvalRun when trials > 1:
export interface TrialStat {
  readonly name: string;
  readonly n: number;
  readonly mean: number;
  readonly stderr: number;      // sqrt(p(1-p)/n) for a pass rate; sample stderr for continuous
  readonly values: readonly number[];
  readonly reduced: Readonly<Record<Reducer, number>>;  // one entry per requested reducer
}
```

- Each case runs `trials` times (dispatched through the concurrency pool from §4). Per-scorer values
  are collapsed by the requested reducer(s).
- **`pass@k`** uses the unbiased Chen et al. estimator: `1 − C(n−c, k) / C(n, k)` for `c` passing of
  `n` trials (`k ≤ n`) — not a naive `min(1, c)`. **`pass^k`** = all-k-pass reliability.
- `EvalRun.passed` becomes reducer-driven: for `mean`/`median` it's `reduced ≥ threshold`; for `pass@k`
  it's the pass@k value ≥ threshold (default 1 → "at least one of k passed"). Multiple reducers →
  multiple reported metrics from one run (Inspect's `--epochs-reducer "mean,pass@5,pass^5"`).
- Report shows `mean ± stderr`; the HTML report gets a small per-scorer distribution sparkline.

---

## 4. Concurrency (Tier 1) — internal refactor + `maxConcurrency`

Replace the sequential `for await` in `runEval`/`runSuite` with a bounded async pool over the
(case × trial) task list. Zero deps (a small Promise-pool; Bun/JS built-ins only).

```ts
export type RunEvalOptions<Deps, Ctx> = DepsOption<Deps> & {
  // …existing…
  readonly maxConcurrency?: number;   // default 4 (provider-friendly); Infinity for scripted/replay
  readonly delayMs?: number;          // optional dispatch spacing for provider rate limits
};
```

Requirements: **output order is preserved** (results yielded/collected in case order regardless of
completion order); `onRun` still fires as each case *completes*; `replay` mode can default to a high
concurrency since it's CPU-only and network-free. Default `4` mirrors Promptfoo; `delayMs` mirrors its
rate-limit backpressure.

---

## 5. `mithril eval` CLI + file convention (Tier 1) — the biggest DX unlock

### 5.1 File convention — `defineEval`

```ts
export interface EvalFile<Deps = void, Ctx = void> {
  readonly agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>;
  readonly cases: readonly EvalCase<Ctx>[];
  readonly options?: RunEvalOptions<Deps, Ctx> & TrialOptions;
}
/** Identity helper giving the CLI a typed, discoverable default export. Also usable programmatically. */
export function defineEval<Deps, Ctx>(spec: EvalFile<Deps, Ctx>): EvalFile<Deps, Ctx>;
```

A `*.eval.ts` file `export default defineEval({ agent, cases, options })` (Braintrust's `*.eval.ts`
convention, adapted and typed).

### 5.2 CLI

- **Placement decision:** ship a `mithril-eval` bin from `@mithril/evals`, and (optionally) surface it
  as `mithril eval` from the `mithril` meta-package. **Recommend** `@mithril/evals` bin now (least
  coupling); alias from `mithril` later. *(Minor naming decision — flag.)*
- **Discovery:** `Bun.Glob("**/*.eval.ts")` (zero dep), load via dynamic `import()`. Runs on Bun →
  native TS, **no build step** (matches Braintrust; fits our Bun-first constitution).
- **Flags:** `--watch`, `--filter <glob|tag>`, `--trials <n>`, `--reducer <list>`,
  `--record [dir]` / `--replay [dir]`, `--concurrency <n>`, `--reporter html|json|junit|tap`,
  `--out <path>`, `--baseline <file.json>` (diff, §9), `--threshold <n>`. **Non-zero exit** on gate
  failure (Promptfoo's build-fail contract) so CI blocks on regressions.
- `--watch` re-runs on change for the tight local loop (Braintrust/Promptfoo/Evalite parity).

---

## 6. Datasets + loaders (Tier 2) — `packages/evals/src/dataset.ts`

```ts
export function jsonlDataset<Row>(path: string, map: (row: Row, i: number) => EvalCase): Promise<EvalCase[]>;
export function csvDataset(path: string, map: (row: Record<string, string>, i: number) => EvalCase): Promise<EvalCase[]>;
```

Bun file APIs; a tiny built-in CSV split (no dep) documented as "simple CSV" (quote-aware but not a full
RFC-4180 parser — call out the limit honestly). Complements `expected` (§1.2). This is the file-loaded
golden story (Inspect `csv_dataset`/`json_dataset`, DeepEval goldens).

---

## 7. Scorers only *we* can write (Tier 2, differentiation) — extend `index.ts`

Assertions over events no input/output framework has. All pure, zero dep.

```ts
approvedBefore(tool: string): Scorer      // a tool.approval(.requested)/suspend/resume precedes tool.call(tool)
handedOffTo(agentName: string): Scorer    // handoff / handoff.result to the named sub-agent
usedSubAgent(name: string): Scorer        // span tree: a child span of kind "invoke_agent"
producedValidObject(): Scorer             // object.final present with no trailing object.invalid
recoveredCleanly(): Scorer                // tool.retry that ended in a tool.result (self-corrected), no unrecovered error
noRepairs(): Scorer                       // zero tool.repair / tool.retry (model got it right first try)
reasonedBefore(tool: string): Scorer      // reasoning.delta precedes the first tool.call
```

These exploit `handoff`, `tool.approval`/`suspend`/`resume`, `object.final`/`object.invalid`,
`tool.repair`/`tool.retry`, `reasoning.delta`, and `SpanRef.kind` — and double as the regression guards
for the harness's own HITL/handoff/self-correction behavior (see §11).

---

## 8. LLM-judge upgrade (Tier 2) — rework `llmJudge`, add `pairwiseJudge`

```ts
export function llmJudge(opts: {
  readonly model: ModelInput;
  readonly rubric: string;
  readonly input?: "text" | "trajectory";              // default "text"; "trajectory" folds messages+tool calls
  readonly choices?: Readonly<Record<string, number>>; // rubric grade → score (e.g. {C:1,P:0.5,I:0}); else freeform 0..1
  readonly cot?: boolean;                               // chain-of-thought before the verdict
  readonly reference?: boolean;                         // include case.expected as the grading reference
  readonly jurors?: readonly ModelInput[];              // multi-model majority vote
  readonly name?: string; readonly transport?: Transport;
}): Scorer;

/** A/B "battle" judge for comparing two runs (model/prompt comparison) — returns which is better. */
export function pairwiseJudge(opts: { model: ModelInput; rubric: string; name?: string; transport?: Transport }):
  (a: Trajectory, b: Trajectory) => Promise<Score>;
```

Adds: trajectory-aware grading (not just final text), rubric **choice→score** mapping (Braintrust
`choiceScores`, Inspect `GRADE: C/I/P` + `partial_credit`), chain-of-thought, reference-based grading,
and **multi-model majority vote** (Inspect `model=[…]`). `pairwiseJudge` is Braintrust `Battle` /
LangSmith pairwise. All reuse our own `agent()`. Keeps default `input:"text"` so existing behavior is
unchanged.

---

## 9. Baseline diff + CI (Tier 2) — `packages/evals/src/diff.ts` + report + action

```ts
export interface RunSnapshot { readonly generatedAt: string; readonly runs: readonly EvalRunSummary[]; }
export function toSnapshot(runs: readonly EvalRun[]): RunSnapshot;                 // JSON-serializable
export function diffRuns(baseline: RunSnapshot, current: RunSnapshot): {
  readonly improved: readonly string[]; readonly regressed: readonly string[];
  readonly added: readonly string[];    readonly removed: readonly string[];
};
```

- CLI `--reporter json` emits `RunSnapshot`; `--baseline b.json` runs `diffRuns` and **exits non-zero on
  any `regressed`** (DeepEval `--official`, Braintrust hill-climb, Promptfoo PR-diff).
- `htmlReport` gains a **two-run diff mode** (baseline vs current, regressions sorted first) — the
  comparison dimension we lack today.
- A thin **GitHub Action** wraps the CLI and comments improved/regressed cases on the PR (Braintrust
  `eval-action` parity), with a `--first N`/`--filter` smoke subset on PRs and the full run on merge.

---

## 10. Devtools wiring (Tier 1 DX) — bridge evals ↔ `@mithril/devtools`

We already own Inspect's crown-jewel (a span-tree, time-travel run inspector that renders
`MithrilEvent`). `EvalRun.trajectory.log` *is* a recorded `MithrilEvent[]`, so:

- **`htmlReport(entries, { inspector: true })`** — opt-in richer report that inlines the devtools
  element bundle (`@mithril/devtools/element` + `ui.css`) and mounts `<mithril-run-inspector>` per row
  (its `.events` accepts a recorded log). Default report stays lean/zero-dep; the inspector build is the
  opt-in deep-dive. Style via existing devtools/report design tokens (no hard-coded hex).
- **`mithril eval --watch --inspect`** — opens the devtools panel for the running case: our `inspect
  view` equivalent, reusing the UI wholesale.

Low cost, high payoff: the hard part (the inspector) exists; v2 just gives evals an entry point into it.

---

## 11. Applying evals to the harness (fix the "testing an agent like a model benchmark" gap)

Today `apps/evals` only gates the **local-model catalog**. v2 additions above unlock harness-behavior
regression testing:

- **Dogfood the §7 scorers** in the framework's own `bun:test` via `describeEval` — guard HITL
  (`approvedBefore` a destructive tool), handoff routing (`handedOffTo`), self-correction
  (`recoveredCleanly` / `noRepairs`), structured output (`producedValidObject`), and budgets
  (`staysBounded`, existing). These are behaviors most likely to silently regress.
- **Reference-matcher regressions:** record known-good trajectories, convert via
  `referenceFromTrajectory`, and gate loop/tool changes with `matchesTrajectory(..., { mode: "strict" })`
  under `--replay` (network-free CI). Pairs with the under-marketed `trajectoryToScript` (re-runs the
  real loop/tools against recorded model turns).
- **Broaden `apps/evals`** into a canonical agent-behavior suite (tool selection, ordering, HITL,
  handoff, structured output, self-correction, budget) that doubles as living docs / playground presets.

---

## 12. Sequencing

**Phase A — additive, parallelizable, no ordering constraints:**
- §4 concurrency (bounded pool + `maxConcurrency`/`delayMs`)
- §1.1 `Score` (`null` + `metadata` + `ScorerResult`)
- §2 reference matcher + `referenceFromTrajectory`
- §7 unique-event scorers
- §6 datasets/loaders + §1.2 `expected` on `EvalCase`

**Phase B — builds on A:**
- §3 trials + reducers + pass@k (needs the pool)
- §1.1 → aggregate/`grouped` metrics (needs Score changes)
- §8 llmJudge upgrade + `pairwiseJudge` (shared transcript builder)

**Phase C — consumes the above; where the DX lands:**
- §5 CLI + `defineEval`
- §10 devtools wiring
- §9 baseline diff + GitHub Action (needs the JSON reporter)

**Cross-cutting breaking change:** §1.3 Scorer signature (Option B) — land first in Phase A so every new
scorer is written against the final shape.

---

## 13. Decisions to confirm before implementation

1. **Scorer signature** — Option B (breaking, single args object) vs Option A (non-breaking ctx). *Rec: B.*
2. **CLI placement/name** — `@mithril/evals` bin `mithril-eval` now vs `mithril eval` subcommand. *Rec: bin now, alias later.*
3. **Default `maxConcurrency`** — proposed `4` (live) / high (replay). Confirm the number.
4. **`htmlReport` inspector build** — accept an opt-in bundle-embedding path in the otherwise zero-dep
   report (adds the devtools JS/CSS only when `{ inspector: true }`). Confirm that's acceptable.

---

## 14. Verification & docs-lockstep obligations (hard project rules)

Every public API addition here is a `packages/*` change → **must ship its docs in the same commit**:

1. **TSDoc** on each new/changed export (summary, `@param`/`@returns`, `@example`, `{@link}` cross-links,
   `@remarks` for caveats) — it powers the generated reference *and* editor IntelliSense.
2. `bun run docs:build` (regenerates `reference/` + `symbols.json`).
3. Update **`guides/evals.mdx`** (reference matcher, trials/pass@k, judge rubric, CLI, diff).
4. Add **playground presets** (`apps/docs/src/playground/presets.ts`) for the new shapes.
5. Update **`roadmap.mdx`** — move shipped items off the roadmap; keep online/production scoring and
   sandbox-per-case (Tier 3) *on* it, honestly.

**Gates (all must pass):** `bun test` · `bun run typecheck` · `bun run docs:build` · `bun run docs:check`
· `bun run docs:check-symbols` · `bun run docs:check-pages`. Editing docs must never change `packages/*`,
and vice-versa each ships together.

---

## Appendix — field references (what each idea steals)

- **Reference matcher modes + arg modes + per-tool comparator** — LangChain AgentEvals
  `create_trajectory_match_evaluator`.
- **Epochs/reducers, pass@k, stderr/bootstrap, transcript viewer, model-graded partial/majority,
  sandbox-per-sample** — Inspect AI.
- **`Eval()` one-primitive ergonomics, `*.eval.ts` + zero-config CLI (`--watch`/`--first N`),
  `hooks.metadata` trajectory capture, `trialCount` + significance, PR-diff CI, `LLMClassifierFromTemplate`
  (choiceScores + CoT), `Battle`** — Braintrust.
- **pytest bridge, `ToolCorrectnessMetric`/`TaskCompletionMetric`, `--official` baseline** — DeepEval.
- **`runEvals` gates + verdict, `trajectory-accuracy`/`tool-call-accuracy`, sampling-rate online
  scoring** — Mastra.
- **Static-HTML-bundle-for-CI (validates our `htmlReport`)** — Evalite. **JUnit/exit-code build-fail** —
  Promptfoo.
