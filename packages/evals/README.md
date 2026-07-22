# @mithril/evals

Trajectory-native evals: the recorded event log *is* the fixture, and scorers are pure functions over it —
so you can assert on tool selection, ordering, cost, and outcome, not just the final string.

```ts
import { runEval, describeEval, calledTool, completed, type Scorer } from "@mithril/evals";
import { test } from "bun:test";

const usedSearch = calledTool("search"); // built-in scorer
const concise: Scorer = (t) => ({ name: "concise", value: t.final.messages.at(-1)!.content.length < 200 ? 1 : 0 });

// Register a bun:test (or vitest) test per case:
describeEval(test, myAgent, [
  { name: "answers with search", input: "weather in NYC?", scorers: [usedSearch, completed(), concise] },
]); // a no-deps agent needs no options object; pass { deps } only when the agent has dependencies
```

Prefer the generator directly when you want the scores/trajectory:

```ts
for await (const run of runEval(myAgent, cases, { deps })) {
  console.log(run.case, run.passed, run.scores);
}
```

## Record once, replay from file

Recording live hits the model every run. To make eval scoring **deterministic and network-free** in CI,
record each case's trajectory once, then replay it — replay re-emits the recorded log wholesale (tools never
re-run, no provider is called), so scores are a pure function of the fixture:

```ts
import { runEvalCached, fsTrajectoryStore } from "@mithril/evals";
import { nodeFileSystem } from "@mithril/fs/node";

const store = fsTrajectoryStore(nodeFileSystem("./fixtures"));

// record once (hits the model):
for await (const _ of runEvalCached(myAgent, cases, { deps, mode: "record", store })) {}

// replay in CI (no network, deterministic):
for await (const run of runEvalCached(myAgent, cases, { deps, mode: "replay", store })) {
  console.log(run.case, run.passed);
}
```

`memoryTrajectoryStore()` is the in-memory store; `serializeTrajectory` / `loadTrajectory` are the codec.

## HTML report

`htmlReport` renders a batch of results into a single self-contained HTML file — summary stats plus a
searchable, filter-by-pass/fail, filter-by-group list of cases (scores, output, tool calls). No deps, no
network; untrusted model output is escaped.

```ts
import { runEval, htmlReport, type EvalReportEntry } from "@mithril/evals";

const entries: EvalReportEntry[] = [];
for await (const run of runEval(agent, cases, { deps })) entries.push({ run, group: "gpt-4o-mini" });
await Bun.write("report.html", htmlReport(entries, { title: "Nightly evals" }));
```

## API

- `runEval(agent, cases, opts?)` → async-iterable of `{ case, scores, trajectory, passed }` (`opts` optional
  for a no-deps agent — no `{ deps: undefined }`).
- `runSuite(entries, opts?)` → `{ runs, passed, total, passRate, ok }` — runs a model×case matrix (each
  `entry` carries its own agent), times each case, and gates on `minPassRate` (`ok` → `process.exitCode`).
- `runEvalCached(agent, cases, opts)` — same, with `mode: "live" | "record" | "replay"` and a `store`.
  Fixtures are keyed by **case name + input hash**, so changing a case's input misses the stale recording.
- `describeEval(register, agent, cases, opts?)` — one test per case; fails if any scorer < `threshold` (default 1).
- `htmlReport(entries, opts?)` → a self-contained HTML string; `EvalReportEntry` = `{ run, group?, durationMs? }`.
- `TrajectoryStore` + `memoryTrajectoryStore()` / `fsTrajectoryStore(fs, { dir? })`; `serializeTrajectory` / `loadTrajectory`.
- `trajectoryToScript(t)` → `ProviderChunk[][]` — replay a recording through `scriptedProvider` so the **real
  loop and tools re-run** (event-log replay runs nothing), to regression-test a tool/loop change offline.
- `Scorer<Ctx>` = `(t: Trajectory, ctx) => Score` where `Score = { name, value, rationale? }`.
- `Trajectory` = `{ runId, log, final }` (`final` is `replay(log)`).
- Tool-trajectory built-ins: `calledTool(name)`, `calledToolWith(name, match)` (right tool + right args),
  `calledInOrder(names)` (relative call order), `toolCallCount(n | { min, max })`, `noToolErrors()`.
- Output/status built-ins: `completed()`, `outputIncludes(substring, { ignoreCase? })`,
  `outputMatches(regex)`, plus the `finalText(t)` helper (folds `text.delta`s into the final string).
- Budget built-ins: `underCost(maxMicroUsd)`, `underSteps(maxSteps)` — guard efficiency regressions.
- LLM-as-judge: `llmJudge({ model, rubric, name? })` — runs a judge model over the final text (live/local only).

`opts.makeContext(t)` supplies a typed `Ctx` to every scorer; `opts.threshold` sets the pass bar.
