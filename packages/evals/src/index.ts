/**
 * Trajectory-native evaluation harness for Mithril agents: run cases, score their recorded event logs, and
 * bridge to a host test runner.
 *
 * @packageDocumentation
 */

import type { Agent, DepsOption, Input, RunHandle, RunOptions } from "@mithril/core/agent";
import { agent as buildAgent } from "@mithril/core/agent";
import type { AnyTool, JsonValue, MithrilEvent, ModelInput, ProviderChunk, RunState, RuntimeAdapter, ToolInputOf, Transport, UsageDelta } from "@mithril/core/protocol";
import { replay } from "@mithril/core/protocol";

// Trajectory-native: the recorded event log IS the fixture. Scorers are pure functions over the trajectory.
// A run can be recorded live (streaming the agent) or replayed from a stored log wholesale — the
// record-once/replay-from-file split that makes eval scoring deterministic and network-free in CI.

/**
 * The observable result of a single agent run: `{ runId, log, final }`, where `log` is the ordered event
 * stream and `final` is the {@link RunState} reconstructed from it via `replay`.
 *
 * @remarks The event log is the fixture — {@link Scorer}s are pure functions over this value.
 */
export interface Trajectory {
  readonly runId: string;
  readonly log: readonly MithrilEvent[];
  readonly final: RunState;
}
/**
 * A single scoring result produced by a {@link Scorer}.
 *
 * @remarks `value` is conventionally in the `0..1` range and compared against `RunEvalOptions.threshold`.
 * `rationale` is optional free-text explaining the score.
 */
export interface Score {
  readonly name: string;
  readonly value: number; // typically 0..1
  readonly rationale?: string;
}
/**
 * A scoring function: given a {@link Trajectory} and caller context, returns a {@link Score} (sync or async).
 *
 * @typeParam Ctx - Per-run context type produced by `RunEvalOptions.makeContext` (defaults to `void`).
 * @see {@link calledTool} and {@link completed} for ready-made scorers.
 */
export type Scorer<Ctx = void> = (t: Trajectory, ctx: Ctx) => Score | Promise<Score>;

/**
 * One evaluation case: a named input paired with the {@link Scorer}s to apply to its resulting trajectory.
 *
 * @typeParam Ctx - Context type threaded to each {@link Scorer}.
 */
export interface EvalCase<Ctx = void> {
  readonly name: string;
  readonly input: Input;
  readonly scorers: readonly Scorer<Ctx>[];
}
/**
 * The outcome of evaluating one {@link EvalCase}: its scores, the captured {@link Trajectory}, and whether
 * every score met the threshold.
 *
 * @remarks `passed` is `true` only when all `scores` have `value >= threshold`.
 */
export interface EvalRun {
  readonly case: string;
  readonly scores: readonly Score[];
  readonly trajectory: Trajectory;
  readonly passed: boolean;
}

/**
 * Options controlling how {@link runEval} / {@link describeEval} execute and score cases.
 *
 * @typeParam Deps - The agent's dependency-injection type, passed through as `RunOptions.deps`.
 * @typeParam Ctx - Per-run scorer context type.
 *
 * @remarks
 * `transport` and `runtime` override the agent's defaults when present. `makeContext` derives the {@link Ctx}
 * value handed to each {@link Scorer} from the trajectory. `threshold` is the minimum passing score and
 * defaults to `1`.
 */
export type RunEvalOptions<Deps, Ctx = void> = DepsOption<Deps> & {
  readonly transport?: Transport;
  readonly runtime?: RuntimeAdapter;
  readonly makeContext?: (t: Trajectory) => Ctx | Promise<Ctx>;
  readonly threshold?: number; // a score >= threshold passes (default 1)
};

/**
 * The trailing options argument of {@link runEval}/{@link describeEval}, made fully optional when `Deps` is
 * `void` — so a no-deps eval is just `runEval(agent, cases)`, with no `{ deps: undefined }` ceremony.
 */
export type EvalArgs<Deps, Ctx> = [Deps] extends [void]
  ? [opts?: RunEvalOptions<void, Ctx>]
  : [opts: RunEvalOptions<Deps, Ctx>];

/**
 * Runs each {@link EvalCase} against `agent`, yielding one {@link EvalRun} per case as it completes.
 *
 * @typeParam Deps - The agent's dependency type.
 * @typeParam Ctx - Per-run scorer context type.
 * @param agent - The agent under test; each case is executed via `agent.stream`.
 * @param cases - The evaluation cases to run, in order.
 * @param opts - {@link RunEvalOptions} supplying `deps`, optional `transport`/`runtime`, `makeContext`, and
 *   `threshold`.
 * @returns An async generator of {@link EvalRun} results, one per case.
 *
 * @remarks
 * Records LIVE by streaming the agent — the full event log is drained per case and the final state is
 * reconstructed with `replay`. For a deterministic, network-free record-once / replay-from-file split, use
 * {@link runEvalCached} with a {@link TrajectoryStore}.
 *
 * @example
 * ```ts
 * for await (const run of runEval(agent, cases, { deps, threshold: 1 })) {
 *   console.log(run.case, run.passed, run.scores);
 * }
 * ```
 */
export async function* runEval<Deps, Ctx = void>(
  agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>,
  cases: readonly EvalCase<Ctx>[],
  ...args: EvalArgs<Deps, Ctx>
): AsyncGenerator<EvalRun> {
  const opts = (args[0] ?? {}) as RunEvalOptions<Deps, Ctx>;
  const threshold = opts.threshold ?? 1;
  for (const c of cases) {
    const trajectory = await captureTrajectory(agent, c.input, opts);
    yield await scoreCase(c, trajectory, opts, threshold);
  }
}

// Stream the agent to completion and capture its full trajectory (the record side).
async function captureTrajectory<Deps, Ctx>(
  agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>,
  input: Input,
  opts: RunEvalOptions<Deps, Ctx>,
): Promise<Trajectory> {
  const runOpts = {
    deps: opts.deps,
    ...(opts.transport !== undefined ? { transport: opts.transport } : {}),
    ...(opts.runtime !== undefined ? { runtime: opts.runtime } : {}),
  } as RunOptions<Deps>;
  // stream()'s conditional RunArgs tuple isn't resolvable for a free Deps here; call via a concrete shape.
  const streamFn = agent.stream as (input: Input, opts: RunOptions<Deps>) => RunHandle<JsonValue>;
  const handle = streamFn(input, runOpts);
  const log: MithrilEvent[] = [];
  for await (const e of handle.events) log.push(e);
  return { runId: handle.runId, log, final: replay(log) };
}

// A stable FNV-1a hash of a case's input, so a fixture key changes when the input does (see caseKey). This
// is what stops replay from silently re-scoring an old trajectory after the case's input was edited.
function hashInput(input: Input): string {
  const s = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** The store key for a case: `name.inputHash`, so replay can't serve a trajectory recorded for a different input. */
function caseKey<Ctx>(c: EvalCase<Ctx>): string {
  return `${c.name}.${hashInput(c.input)}`;
}

async function scoreCase<Ctx>(c: EvalCase<Ctx>, trajectory: Trajectory, opts: { readonly makeContext?: (t: Trajectory) => Ctx | Promise<Ctx> }, threshold: number): Promise<EvalRun> {
  const ctx = (opts.makeContext !== undefined ? await opts.makeContext(trajectory) : undefined) as Ctx;
  const scores: Score[] = [];
  for (const s of c.scorers) scores.push(await s(trajectory, ctx));
  return { case: c.name, scores, trajectory, passed: scores.every((sc) => sc.value >= threshold) };
}

// ── record-once / replay-from-file ─────────────────────────────────────────────────────────────────────

/**
 * A key→string store for persisted trajectories, backing the record/replay split.
 *
 * @remarks {@link memoryTrajectoryStore} is the in-memory reference; {@link fsTrajectoryStore} persists to
 * any Mithril `FileSystem`. Values are the JSON produced by {@link serializeTrajectory}.
 */
export interface TrajectoryStore {
  get(key: string): Promise<string | undefined>;
  put(key: string, value: string): Promise<void>;
}

interface StoredTrajectory {
  readonly v: 1;
  readonly runId: string;
  readonly log: readonly MithrilEvent[];
}

/** Serialize a {@link Trajectory} to a stable JSON string (the event log is the fixture; `final` is derived). */
export function serializeTrajectory(t: Trajectory): string {
  const stored: StoredTrajectory = { v: 1, runId: t.runId, log: t.log };
  return JSON.stringify(stored);
}

const ZERO_DELTA: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

/**
 * Extract the model turns from a recorded {@link Trajectory} as a {@link scriptedProvider} script — one
 * `ProviderChunk[]` per step, carrying that step's `text.delta`s and `tool.call`s (tool *results* are
 * excluded — the real tools re-run).
 *
 * @param t - a recorded trajectory (from {@link runEval} or {@link loadTrajectory}).
 * @returns the turns array to pass to `scriptedProvider(...)`.
 * @remarks This is the bridge that makes replay exercise the **real agent loop and real tools**: feed the
 * script to `scriptedProvider`/`testModel` and run the actual agent, instead of re-emitting the stored event
 * log wholesale (which runs nothing). Use it to regression-test tool or loop changes against a recorded
 * conversation. The model's exact wording is preserved; only the provider calls are replaced by the script.
 * @example
 * ```ts
 * import { scriptedProvider, testModel } from "@mithril/core/testkit";
 *
 * const script = trajectoryToScript(recorded);
 * const replayed = agent({ model: testModel(scriptedProvider(script)), instructions, tools }); // real tools run
 * ```
 */
export function trajectoryToScript(t: Trajectory): ProviderChunk[][] {
  const turns: ProviderChunk[][] = [];
  let current: ProviderChunk[] | undefined;
  for (const e of t.log) {
    if (e.type === "step.start") {
      current = [];
    } else if (e.type === "text.delta" && current !== undefined) {
      current.push({ type: "text.delta", delta: e.delta });
    } else if (e.type === "tool.call" && current !== undefined) {
      current.push({ type: "tool.call", callId: e.callId, name: e.name, input: e.input });
    } else if (e.type === "step.finish" && current !== undefined) {
      current.push({ type: "message.end", usage: ZERO_DELTA, finishReason: e.stop === "tool" ? "tool_calls" : "stop" });
      turns.push(current);
      current = undefined;
    }
  }
  return turns;
}

/** Parse a {@link serializeTrajectory} string back into a {@link Trajectory}, deriving `final` via `replay`. */
export function loadTrajectory(json: string): Trajectory {
  const stored = JSON.parse(json) as StoredTrajectory;
  return { runId: stored.runId, log: stored.log, final: replay(stored.log) };
}

/** Create an in-memory {@link TrajectoryStore} (a `Map`) — for tests and single-process runs. */
export function memoryTrajectoryStore(): TrajectoryStore {
  const map = new Map<string, string>();
  return {
    async get(key) {
      return map.get(key);
    },
    async put(key, value) {
      map.set(key, value);
    },
  };
}

/** The minimal `FileSystem` surface {@link fsTrajectoryStore} needs — satisfied by any `@mithril/fs` backend. */
export interface TrajectoryFs {
  readText(path: string): Promise<string>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/**
 * Back a {@link TrajectoryStore} with a Mithril `FileSystem`, one JSON file per case under `dir`.
 *
 * @param fs - any `@mithril/fs` backend (node / opfs / memory) — only `readText`/`writeFile`/`exists` are used.
 * @param opts - `dir` is the directory for trajectory files (default `"trajectories"`).
 * @returns a persistent {@link TrajectoryStore}.
 */
export function fsTrajectoryStore(fs: TrajectoryFs, opts?: { readonly dir?: string }): TrajectoryStore {
  const dir = opts?.dir ?? "trajectories";
  const pathFor = (key: string): string => `${dir}/${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
  return {
    async get(key) {
      const path = pathFor(key);
      return (await fs.exists(path)) ? fs.readText(path) : undefined;
    },
    async put(key, value) {
      await fs.writeFile(pathFor(key), value);
    },
  };
}

/**
 * Options for {@link runEvalCached}: the base {@link RunEvalOptions} plus a discriminated cache `mode`.
 *
 * @remarks
 * - `"live"` — run the agent every time (no store), identical to {@link runEval}.
 * - `"record"` — run live once and write each case's trajectory to `store`, then score.
 * - `"replay"` — read each case's trajectory from `store` and score it **without running the agent**
 *   (deterministic, zero-network). A missing recording throws.
 */
export type RunEvalCachedOptions<Deps, Ctx = void> = RunEvalOptions<Deps, Ctx> &
  ({ readonly mode: "live" } | { readonly mode: "record"; readonly store: TrajectoryStore } | { readonly mode: "replay"; readonly store: TrajectoryStore });

/**
 * Evaluate cases with a record-once / replay-from-file cache, yielding one {@link EvalRun} per case.
 *
 * @typeParam Deps - the agent's dependency type.
 * @typeParam Ctx - per-run scorer context type.
 * @param agent - the agent under test (used in `"live"`/`"record"`, ignored in `"replay"`).
 * @param cases - the cases to evaluate.
 * @param opts - {@link RunEvalCachedOptions} selecting the cache `mode` and (for record/replay) the `store`.
 * @returns an async generator of {@link EvalRun}.
 * @throws in `"replay"` mode, an `Error` when a case has no stored trajectory (record it first).
 * @remarks Replay re-emits the recorded log wholesale — tools never re-run and no provider is called — so
 * scoring is a pure, deterministic function of the fixture. Record and replay share the same case keys.
 * @example
 * ```ts
 * const store = fsTrajectoryStore(nodeFileSystem("./fixtures"));
 * // record once (hits the model):
 * for await (const _ of runEvalCached(agent, cases, { deps, mode: "record", store })) {}
 * // replay in CI (no network, deterministic):
 * for await (const run of runEvalCached(agent, cases, { deps, mode: "replay", store })) console.log(run.passed);
 * ```
 */
export async function* runEvalCached<Deps, Ctx = void>(
  agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>,
  cases: readonly EvalCase<Ctx>[],
  opts: RunEvalCachedOptions<Deps, Ctx>,
): AsyncGenerator<EvalRun> {
  const threshold = opts.threshold ?? 1;
  for (const c of cases) {
    let trajectory: Trajectory;
    const key = caseKey(c);
    if (opts.mode === "replay") {
      const json = await opts.store.get(key);
      if (json === undefined) {
        throw new Error(`no recorded trajectory for case "${c.name}" at its current input — the input may have changed since it was recorded. Run in mode: "record" first.`);
      }
      trajectory = loadTrajectory(json);
    } else {
      trajectory = await captureTrajectory(agent, c.input, opts);
      if (opts.mode === "record") await opts.store.put(key, serializeTrajectory(trajectory));
    }
    yield await scoreCase(c, trajectory, opts, threshold);
  }
}

/**
 * Registers one host test per {@link EvalCase} against a `test`-shaped function (bun:test / vitest).
 *
 * @typeParam Deps - The agent's dependency type.
 * @typeParam Ctx - Per-run scorer context type.
 * @param register - The host runner's test registrar, e.g. bun:test's `test` — called as
 *   `register(name, fn)` once per case.
 * @param agent - The agent under test.
 * @param cases - The evaluation cases to register.
 * @param opts - {@link RunEvalOptions}; the same `threshold` gates each registered test.
 * @throws Inside each registered test, throws an `Error` listing the failing `name=value` scores when a case
 *   does not pass.
 *
 * @remarks Thin wrapper over {@link runEval} that turns each case into a test which fails on a sub-threshold
 * score.
 *
 * @example
 * ```ts
 * import { test } from "bun:test";
 * describeEval(test, agent, cases, { deps });
 * ```
 */
export function describeEval<Deps, Ctx = void>(
  register: (name: string, fn: () => Promise<void>) => void,
  agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>,
  cases: readonly EvalCase<Ctx>[],
  ...args: EvalArgs<Deps, Ctx>
): void {
  const opts = (args[0] ?? {}) as RunEvalOptions<Deps, Ctx>;
  const threshold = opts.threshold ?? 1;
  for (const c of cases) {
    register(`eval: ${c.name}`, async () => {
      // Cast to the conditional tuple: EvalArgs can't resolve against a free `Deps` at this call site.
      for await (const r of runEval(agent, [c], ...([opts] as unknown as EvalArgs<Deps, Ctx>))) {
        if (!r.passed) {
          const failed = r.scores.filter((s) => s.value < threshold).map((s) => `${s.name}=${s.value}`);
          throw new Error(`${c.name} failed: ${failed.join(", ")}`);
        }
      }
    });
  }
}

// ── suite runner ─────────────────────────────────────────────────────────────────────────────────────

/**
 * One group of cases run against a specific agent in a {@link runSuite} matrix — e.g. one model, or one
 * agent configuration. The per-entry agent is what lets a suite vary instructions/toolset/model per group.
 */
export interface SuiteEntry<Deps, Ctx = void> {
  readonly label: string;
  readonly agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>;
  readonly cases: readonly EvalCase<Ctx>[];
}

/** One {@link EvalRun} within a suite, tagged with its group `label` and wall-clock `durationMs`. */
export interface SuiteRun extends EvalRun {
  readonly group: string;
  readonly durationMs: number;
}

/**
 * The aggregate outcome of {@link runSuite}: every {@link SuiteRun}, the pass counts, and the CI gate verdict.
 *
 * @remarks `ok` is the machine-readable gate: `true` when at least one case ran and `passRate >= minPassRate`.
 */
export interface SuiteResult {
  readonly runs: readonly SuiteRun[];
  readonly passed: number;
  readonly total: number;
  readonly passRate: number;
  readonly ok: boolean;
}

/**
 * Options for {@link runSuite}: {@link RunEvalOptions} plus a CI pass-rate gate and a per-run callback.
 *
 * @remarks `minPassRate` defaults to `1` (every case must pass). `onRun` fires as each case completes — use
 * it to stream progress to the console while the suite runs.
 */
export type SuiteOptions<Deps, Ctx = void> = RunEvalOptions<Deps, Ctx> & {
  readonly minPassRate?: number;
  readonly onRun?: (run: SuiteRun) => void;
};

/** The trailing options argument of {@link runSuite}, made optional when `Deps` is `void`. */
export type SuiteArgs<Deps, Ctx> = [Deps] extends [void]
  ? [opts?: SuiteOptions<void, Ctx>]
  : [opts: SuiteOptions<Deps, Ctx>];

/**
 * Run a matrix of {@link SuiteEntry}s (each an agent + its cases) and aggregate the results behind a
 * pass-rate CI gate — the batteries-included counterpart to calling {@link runEval} in nested loops.
 *
 * @param entries - the groups to run; every case in each entry is scored against that entry's agent.
 * @param args - {@link SuiteOptions} (optional when `Deps` is `void`): scorer `deps`/`makeContext`,
 *   `threshold`, plus `minPassRate` (the CI gate) and `onRun` (per-case progress).
 * @returns a {@link SuiteResult} whose `ok` is the gate verdict — wire it to `process.exitCode`.
 * @example
 * ```ts
 * const result = await runSuite(
 *   models.map((m) => ({ label: m, agent: agent({ model: m, instructions: "…", tools }), cases })),
 *   { minPassRate: 0.8, onRun: (r) => console.log(r.group, r.case, r.passed) },
 * );
 * process.exitCode = result.ok ? 0 : 1;
 * ```
 */
export async function runSuite<Deps, Ctx = void>(
  entries: readonly SuiteEntry<Deps, Ctx>[],
  ...args: SuiteArgs<Deps, Ctx>
): Promise<SuiteResult> {
  const opts = (args[0] ?? {}) as SuiteOptions<Deps, Ctx>;
  const minPassRate = opts.minPassRate ?? 1;
  const runs: SuiteRun[] = [];
  for (const entry of entries) {
    for (const c of entry.cases) {
      const t0 = Date.now();
      let captured: EvalRun | undefined;
      // Cast to the conditional tuple: EvalArgs can't resolve against a free `Deps` at this call site.
      for await (const r of runEval(entry.agent, [c], ...([opts] as unknown as EvalArgs<Deps, Ctx>))) captured = r;
      if (captured === undefined) continue;
      const run: SuiteRun = { ...captured, group: entry.label, durationMs: Date.now() - t0 };
      runs.push(run);
      opts.onRun?.(run);
    }
  }
  const passed = runs.filter((r) => r.passed).length;
  const total = runs.length;
  const passRate = total === 0 ? 0 : passed / total;
  return { runs, passed, total, passRate, ok: total > 0 && passRate >= minPassRate };
}

// ── common scorers ───────────────────────────────────────────────────────────────────────────────────

/**
 * A {@link Scorer} that scores `1` if the trajectory contains a `tool.call` event for `name`, else `0`.
 *
 * @param name - The tool name to look for in the event log.
 * @returns A {@link Scorer} named `called:{name}`.
 */
export function calledTool(name: string): Scorer {
  return (t) => ({
    name: `called:${name}`,
    value: t.log.some((e) => e.type === "tool.call" && e.name === name) ? 1 : 0,
  });
}
/**
 * A {@link Scorer} that scores `1` if the trajectory has a `tool.call` for `name` whose input satisfies
 * `match`, else `0` — for asserting a tool was called with the *right* arguments (not just that it ran).
 *
 * @param toolOrName - the tool to look for — pass the tool value to get its input type inferred in
 *   `match` (and a rename becomes a compile error), or a bare name string (then `match` sees a `JsonValue`).
 * @param match - a predicate over the call's `input`.
 * @returns a {@link Scorer} named `calledWith:{name}`.
 * @example
 * ```ts
 * // Pass the tool value — `i` is typed, no cast, rename-safe:
 * calledToolWith(convertCurrency, (i) => i.amount === 100);
 * // Or by name — `i` is a JsonValue:
 * calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100);
 * ```
 * @see {@link calledTool} for a name-only check.
 */
export function calledToolWith<T extends AnyTool<never>>(tool: T, match: (input: ToolInputOf<T>) => boolean): Scorer;
export function calledToolWith(name: string, match: (input: JsonValue) => boolean): Scorer;
export function calledToolWith(toolOrName: string | AnyTool<never>, match: (input: never) => boolean): Scorer {
  const name = typeof toolOrName === "string" ? toolOrName : toolOrName.name;
  const test = match as (input: JsonValue) => boolean;
  return (t) => ({
    name: `calledWith:${name}`,
    value: t.log.some((e) => e.type === "tool.call" && e.name === name && test((e as unknown as { input: JsonValue }).input)) ? 1 : 0,
  });
}
/**
 * A {@link Scorer} that scores `1` if the run's final {@link RunState} status is `"completed"`, else `0`.
 *
 * @returns A {@link Scorer} named `completed`.
 */
export function completed(): Scorer {
  return (t) => ({ name: "completed", value: t.final.status === "completed" ? 1 : 0 });
}

/**
 * Concatenate every `text.delta` in a trajectory into the assistant's final text output.
 *
 * @param t - the {@link Trajectory} to read.
 * @returns the joined assistant text (empty string if the run produced none).
 * @remarks The building block for text scorers ({@link outputIncludes}/{@link outputMatches}); exported so
 * custom scorers and reporters don't each re-fold the event log.
 */
export function finalText(t: Trajectory): string {
  return t.log.reduce((acc, e) => (e.type === "text.delta" ? acc + e.delta : acc), "");
}

/**
 * A {@link Scorer} that scores `1` if the assistant's final text contains `substring`, else `0`.
 *
 * @param substring - the text to look for; matched case-sensitively unless `ignoreCase` is set.
 * @param opts - `{ ignoreCase }` to compare case-insensitively.
 * @returns a {@link Scorer} named `includes:{substring}`.
 */
export function outputIncludes(substring: string, opts?: { readonly ignoreCase?: boolean }): Scorer {
  return (t) => {
    const hay = opts?.ignoreCase === true ? finalText(t).toLowerCase() : finalText(t);
    const needle = opts?.ignoreCase === true ? substring.toLowerCase() : substring;
    return { name: `includes:${substring}`, value: hay.includes(needle) ? 1 : 0 };
  };
}

/**
 * A {@link Scorer} that scores `1` if the assistant's final text matches `pattern`, else `0`.
 *
 * @param pattern - the {@link RegExp} to test against the joined final text.
 * @returns a {@link Scorer} named `matches:{pattern.source}`.
 */
export function outputMatches(pattern: RegExp): Scorer {
  return (t) => ({ name: `matches:${pattern.source}`, value: pattern.test(finalText(t)) ? 1 : 0 });
}

/**
 * A {@link Scorer} that scores `1` if the trajectory's `tool.call`s include `names` in the given relative
 * order (other calls may appear in between), else `0` — for asserting a tool *sequence*, not just presence.
 *
 * @param names - the tool names that must appear in this order.
 * @returns a {@link Scorer} named `inOrder:{names}`.
 * @example
 * ```ts
 * // the agent must search before it books:
 * calledInOrder(["search_flights", "book_flight"]);
 * ```
 */
export function calledInOrder(names: readonly string[]): Scorer {
  return (t) => {
    const calls = t.log.flatMap((e) => (e.type === "tool.call" ? [e.name] : []));
    let i = 0;
    for (const name of calls) if (i < names.length && name === names[i]) i++;
    return { name: `inOrder:${names.join(">")}`, value: i === names.length ? 1 : 0 };
  };
}

/**
 * A {@link Scorer} that scores `1` if the number of `tool.call`s falls within `expected`, else `0`.
 *
 * @param expected - an exact count, or a `{ min?, max? }` range (inclusive; omitted bound is unbounded).
 * @returns a {@link Scorer} named `toolCalls:{expected}`.
 * @remarks Catches efficiency regressions (a model that fans out redundant calls) and under-calling alike.
 */
export function toolCallCount(expected: number | { readonly min?: number; readonly max?: number }): Scorer {
  const range = typeof expected === "number" ? { min: expected, max: expected } : expected;
  const label = typeof expected === "number" ? `${expected}` : `${range.min ?? 0}..${range.max ?? "∞"}`;
  return (t) => {
    const n = t.log.reduce((acc, e) => (e.type === "tool.call" ? acc + 1 : acc), 0);
    const ok = (range.min === undefined || n >= range.min) && (range.max === undefined || n <= range.max);
    return { name: `toolCalls:${label}`, value: ok ? 1 : 0, rationale: `observed ${n} tool call(s)` };
  };
}

/**
 * A {@link Scorer} that scores `1` if the trajectory contains no `tool.error` events, else `0`.
 *
 * @returns a {@link Scorer} named `noToolErrors`.
 */
export function noToolErrors(): Scorer {
  return (t) => {
    const errors = t.log.flatMap((e) => (e.type === "tool.error" ? [e.error.name] : []));
    return {
      name: "noToolErrors",
      value: errors.length === 0 ? 1 : 0,
      ...(errors.length > 0 ? { rationale: `tool errors: ${errors.join(", ")}` } : {}),
    };
  };
}

/**
 * A {@link Scorer} that scores `1` if the run's total cost is at or under `maxMicroUsd` micro-USD, else `0`.
 *
 * @param maxMicroUsd - the cost ceiling in micro-USD (1e-6 USD), read from the run's final usage.
 * @returns a {@link Scorer} named `underCost:{maxMicroUsd}`.
 */
export function underCost(maxMicroUsd: number): Scorer {
  return (t) => {
    const cost = t.final.usage.costMicroUsd;
    return { name: `underCost:${maxMicroUsd}`, value: cost <= maxMicroUsd ? 1 : 0, rationale: `cost ${cost}µ$` };
  };
}

/**
 * A {@link Scorer} that scores `1` if the run used at most `maxSteps` steps, else `0`.
 *
 * @param maxSteps - the step ceiling, read from the run's final usage.
 * @returns a {@link Scorer} named `underSteps:{maxSteps}`.
 */
export function underSteps(maxSteps: number): Scorer {
  return (t) => {
    const steps = t.final.usage.steps;
    return { name: `underSteps:${maxSteps}`, value: steps <= maxSteps ? 1 : 0, rationale: `${steps} step(s)` };
  };
}

/**
 * An LLM-as-judge {@link Scorer}: runs a small judge agent on the run's final text and returns its `0..1`
 * score. The judge is prompted to reply with `{"score", "rationale"}` JSON, which is parsed into the score.
 *
 * @param opts - `model` (any {@link ModelInput} — a judge handle), the grading `rubric`, an optional scorer
 *   `name` (default `"llmJudge"`), and `transport` for the judge's provider auth.
 * @returns an async {@link Scorer}; a judge that errors or returns non-JSON scores `0` with a rationale.
 * @remarks Unlike the trajectory scorers, this makes a real model call, so it runs only against a live/local
 * judge model (not the scripted test double). Keep the rubric specific and the judge model cheap.
 * @example
 * ```ts
 * llmJudge({ model: anthropic("claude-3-5-haiku-latest"), rubric: "Is the answer correct and concise?" });
 * ```
 */
export function llmJudge(opts: { readonly model: ModelInput; readonly rubric: string; readonly name?: string; readonly transport?: Transport }): Scorer {
  const label = opts.name ?? "llmJudge";
  return async (t) => {
    const transcript = finalText(t) || "(the run produced no text output)";
    const judge = buildAgent({
      model: opts.model,
      instructions: `${opts.rubric}\n\nScore the ASSISTANT OUTPUT below from 0 to 1. Reply with ONLY a JSON object: {"score": <number 0..1>, "rationale": "<one sentence>"}.`,
    });
    const res = await judge.run(`ASSISTANT OUTPUT:\n${transcript}`, opts.transport !== undefined ? { transport: opts.transport } : {});
    if (res.status !== "completed") return { name: label, value: 0, rationale: `judge run ${res.status}` };
    try {
      const parsed = JSON.parse(res.output) as { score?: unknown; rationale?: unknown };
      const raw = typeof parsed.score === "number" ? parsed.score : 0;
      const value = Math.max(0, Math.min(1, raw));
      return { name: label, value, ...(typeof parsed.rationale === "string" ? { rationale: parsed.rationale } : {}) };
    } catch {
      return { name: label, value: 0, rationale: "judge output was not valid JSON" };
    }
  };
}

// ── reporting ────────────────────────────────────────────────────────────────────────────────────────────

export { htmlReport } from "./report.ts";
export type { EvalReportEntry, HtmlReportOptions } from "./report.ts";
