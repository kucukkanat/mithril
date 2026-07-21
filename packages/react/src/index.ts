/**
 * Headless React bindings for Mithril runs — hooks and a framework-agnostic store, no components.
 *
 * @remarks
 * This entrypoint holds the DOM-free {@link createRunStore} (a `subscribe`/`getSnapshot` store),
 * so `@mithril/react` itself needs no React peer. The actual hooks — {@link useRun}, {@link useObject} —
 * live in `@mithril/react/hooks`, which declares the `react >=18` peer dependency.
 *
 * @packageDocumentation
 */

import { type MithrilEvent, replay, type RunState } from "@mithril/core/protocol";

// The framework-agnostic core of the React bindings: a subscribe/getSnapshot store over an event source
// (a RunHandle or any AsyncIterable<MithrilEvent>). `useRun` is a one-line useSyncExternalStore wrapper over
// this (below) — the store holds all the logic, so it is tested without a DOM.

/**
 * An immutable view of a run, recomputed on every event.
 *
 * @remarks
 * Shape: `{ state, text, status, events, costUsd }`.
 */
export interface RunSnapshot {
  /** The full replayed {@link RunState} for the events seen so far. */
  readonly state: RunState;
  /** All `text.delta` chunks concatenated into the running output string. */
  readonly text: string;
  /** `"streaming"` while events are still arriving; otherwise the terminal {@link RunState.status}. */
  readonly status: RunState["status"] | "streaming";
  /** Every event received so far, in order. */
  readonly events: readonly MithrilEvent[];
  /** Accumulated cost in US dollars (derived from `state.usage.costMicroUsd`). */
  readonly costUsd: number;
}

/** A `useSyncExternalStore`-compatible store over a run's events. Created by {@link createRunStore}. */
export interface RunStore {
  /** Register a change listener; returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void;
  /** Return the current {@link RunSnapshot} (a stable reference between changes). */
  getSnapshot(): RunSnapshot;
}

const EMPTY: RunSnapshot = { state: replay([]), text: "", status: "streaming", events: [], costUsd: 0 };

/**
 * Build a framework-agnostic {@link RunStore} that folds an event stream into a live {@link RunSnapshot}.
 *
 * @remarks
 * Immediately begins consuming `source`, recomputing the snapshot and notifying subscribers on each event;
 * `status` flips off `"streaming"` once the stream ends. This is the DOM-free core that {@link useRun}
 * wraps — pass the `.events` iterable directly (e.g. `createRunStore(handle.events)`).
 *
 * @param source - The run's event stream (e.g. a `RunHandle`'s `.events`).
 * @returns A store exposing `subscribe` and `getSnapshot`.
 */
export function createRunStore(source: AsyncIterable<MithrilEvent>): RunStore {
  const events: MithrilEvent[] = [];
  let snapshot: RunSnapshot = EMPTY;
  let ended = false;
  const subs = new Set<() => void>();

  const recompute = (): void => {
    const state = replay(events);
    const text = events.flatMap((e) => (e.type === "text.delta" ? [e.delta] : [])).join("");
    snapshot = {
      state,
      text,
      status: ended ? state.status : "streaming",
      events: [...events],
      costUsd: state.usage.costMicroUsd / 1e6,
    };
    for (const s of subs) s();
  };

  void (async () => {
    for await (const e of source) {
      events.push(e);
      recompute();
    }
    ended = true;
    recompute();
  })();

  return {
    subscribe(onChange) {
      subs.add(onChange);
      return () => {
        subs.delete(onChange);
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };
}

// useRun(handle) in a React app is exactly:
//   const store = useMemo(() => createRunStore(handle.events), [handle]);
//   return useSyncExternalStore(store.subscribe, store.getSnapshot);
// (kept out of this file so the package type-checks without the react peer in this environment.)
