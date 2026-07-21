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
 * A tiny test-runner bridge so the conformance kit runs under `bun:test` or
 * `vitest` without depending on either.
 */
export interface TestAdapter {
  test(name: string, fn: () => void | Promise<void>): void;
  assertEqual(actual: unknown, expected: unknown, message?: string): void;
}
