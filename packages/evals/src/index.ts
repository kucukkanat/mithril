/**
 * Trajectory-native evaluation harness for Mithril agents: run cases, score their recorded event logs, and
 * bridge to a host test runner.
 *
 * @packageDocumentation
 */

import type { Agent, Input, RunHandle, RunOptions } from "@mithril/core/agent";
import type { AnyTool, JsonValue, MithrilEvent, RunState, RuntimeAdapter, Transport } from "@mithril/core/protocol";
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
export interface RunEvalOptions<Deps, Ctx = void> {
  readonly deps: Deps;
  readonly transport?: Transport;
  readonly runtime?: RuntimeAdapter;
  readonly makeContext?: (t: Trajectory) => Ctx | Promise<Ctx>;
  readonly threshold?: number; // a score >= threshold passes (default 1)
}

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
  opts: RunEvalOptions<Deps, Ctx>,
): AsyncGenerator<EvalRun> {
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
    if (opts.mode === "replay") {
      const json = await opts.store.get(c.name);
      if (json === undefined) throw new Error(`no recorded trajectory for case "${c.name}" — run in mode: "record" first`);
      trajectory = loadTrajectory(json);
    } else {
      trajectory = await captureTrajectory(agent, c.input, opts);
      if (opts.mode === "record") await opts.store.put(c.name, serializeTrajectory(trajectory));
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
  opts: RunEvalOptions<Deps, Ctx>,
): void {
  const threshold = opts.threshold ?? 1;
  for (const c of cases) {
    register(`eval: ${c.name}`, async () => {
      for await (const r of runEval(agent, [c], opts)) {
        if (!r.passed) {
          const failed = r.scores.filter((s) => s.value < threshold).map((s) => `${s.name}=${s.value}`);
          throw new Error(`${c.name} failed: ${failed.join(", ")}`);
        }
      }
    });
  }
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
 * @param name - the tool name to look for in the event log.
 * @param match - a predicate over the call's `input` ({@link JsonValue}).
 * @returns a {@link Scorer} named `calledWith:{name}`.
 * @example
 * ```ts
 * // the model converted the right amount:
 * calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100);
 * ```
 * @see {@link calledTool} for a name-only check.
 */
export function calledToolWith(name: string, match: (input: JsonValue) => boolean): Scorer {
  return (t) => ({
    name: `calledWith:${name}`,
    value: t.log.some((e) => e.type === "tool.call" && e.name === name && match((e as unknown as { input: JsonValue }).input)) ? 1 : 0,
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

// ── reporting ────────────────────────────────────────────────────────────────────────────────────────────

export { htmlReport } from "./report.ts";
export type { EvalReportEntry, HtmlReportOptions } from "./report.ts";
