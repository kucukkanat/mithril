import type { SuspensionDescriptor } from "./suspension.ts";

// §10 — Checkpointer interface + conformance ship in core; durable impls live in @mithril/memory behind
// explicit per-runtime subpaths. A checkpoint stores an opaque (sealed or unsigned) run token as a blob.

/** A branded opaque string holding a serialized {@link RunState} token blob (v1). */
export type SerializedRunState = string & { readonly __brand: "mithril.runstate.v1" };

/** One persisted checkpoint in a run's history — an opaque run token plus routing metadata. */
export interface CheckpointRecord {
  readonly runId: string;
  /** Monotonic ULID, `getRandomValues`-derived so it is insecure-context safe. */
  readonly checkpointId: string;
  /** The prior checkpoint id this one descends from, or `null` for the first. */
  readonly parentId: string | null;
  /** Opaque (sealed or unsigned) state blob; `null` when unsealable. */
  readonly token: string | null;
  readonly status: string;
  readonly createdAt: string;
  /** Unsealed, non-sensitive pending suspension — lets a UI render "awaiting approval" without opening the token. */
  readonly pending?: SuspensionDescriptor;
}

/**
 * The persistence contract for durable runs.
 *
 * @remarks
 * The interface and conformance kit ship in core; concrete durable
 * implementations live in `@mithril/memory` behind per-runtime subpaths.
 * `put` is optimistic-concurrency aware via `opts.ifParent`, returning
 * `'conflict'` when the expected parent does not match.
 */
export interface Checkpointer {
  put(rec: CheckpointRecord, opts?: { readonly ifParent?: string | null }): Promise<"ok" | "conflict">;
  latest(runId: string): Promise<CheckpointRecord | undefined>;
  get(runId: string, checkpointId: string): Promise<CheckpointRecord | undefined>;
  history(runId: string): AsyncIterable<CheckpointRecord>;
  purge(runId: string): Promise<void>;
}

/**
 * Opt-in durable persistence for a run, passed as `RunOptions.persistence`.
 *
 * @remarks
 * When present, the agent loop calls the {@link Checkpointer} automatically — no glue: a checkpoint is
 * written when the run reaches a terminal state or suspends, chained onto the run's prior checkpoint. A
 * `suspended` run stores its resumable token; terminal states (`completed`/`error`/`cancelled`) record the
 * outcome with a `null` token. Resume a suspended run in another process straight from storage with
 * {@link Agent.resumeFrom} / {@link Agent.resumeStreamFrom} — you never touch the token by hand.
 *
 * `runId` makes a run addressable across processes: pass the same id on the original run and on
 * `resumeFrom(runId, …)`. Omitted ⇒ a fresh random id (fine for a single-process run, but you then need the
 * `runId` off the {@link RunHandle} to resume later). `seal`/`open` are an optional symmetric pair applied to
 * the token before it is stored and after it is loaded — supply them (e.g. wrapping {@link seal}/{@link open})
 * to sign or encrypt state before it crosses a trust boundary; omitted ⇒ the token is stored as unsigned
 * `durable-local` JSON.
 *
 * @example
 * ```ts
 * import { sqliteNodeCheckpointer } from "@mithril/memory/sqlite-node";
 * const persistence = { checkpointer: sqliteNodeCheckpointer("./runs.db"), runId: "order-42" };
 *
 * const r = await agent.run("Refund order 42.", { persistence }); // auto-checkpointed
 * if (r.status === "suspended") {
 *   // …later, in another process, once a human approves:
 *   await agent.resumeFrom("order-42", { kind: "approve" }, { persistence });
 * }
 * ```
 */
export interface Persistence {
  /** Where checkpoints are written and read. */
  readonly checkpointer: Checkpointer;
  /** Stable id addressing this run across processes; omitted ⇒ a fresh random id. */
  readonly runId?: string;
  /** Optional: seal the token before it is stored (e.g. wrap {@link seal}); paired with `open`. */
  readonly seal?: (token: string) => string | Promise<string>;
  /** Optional: reverse of `seal`, applied to a stored blob before resume (e.g. wrap {@link open}). */
  readonly open?: (blob: string) => string | Promise<string>;
}

/**
 * A tiny test-runner bridge so the conformance kit runs under `bun:test` or
 * `vitest` without depending on either.
 */
export interface TestAdapter {
  test(name: string, fn: () => void | Promise<void>): void;
  assertEqual(actual: unknown, expected: unknown, message?: string): void;
}
