/**
 * React hooks for subscribing components to Mithril runs — {@link useRun} and {@link useObject}.
 *
 * @remarks
 * Thin `useSyncExternalStore` wrappers over the framework-agnostic store from `@mithril/react`. This
 * entrypoint (`@mithril/react/hooks`) declares the `react >=18` peer dependency.
 *
 * @packageDocumentation
 */

import { useMemo, useSyncExternalStore } from "react";
import type { JsonValue, MithrilEvent } from "@mithril/core/protocol";
import { createRunStore, type RunSnapshot } from "./index.ts";

// The actual React hooks — thin useSyncExternalStore wrappers over the (framework-agnostic, tested) store.
// Kept in a separate entrypoint (`@mithril/react/hooks`) so `@mithril/react` itself needs no react peer.

/**
 * Anything carrying a run event stream — notably a `RunHandle`, which satisfies this shape.
 *
 * @remarks
 * Accepted by {@link useRun} and {@link useObject}; typically `agent.stream(input)`.
 */
export interface RunSource {
  /** The run's event stream. */
  readonly events: AsyncIterable<MithrilEvent>;
}

/**
 * Subscribe a component to a streaming run and re-render as events arrive.
 *
 * @param source - A {@link RunSource}, e.g. `agent.stream(input)`.
 * @returns The current {@link RunSnapshot}, updated on each event.
 * @remarks Memoizes the store on `source` identity; pass a stable handle to avoid re-subscribing every render.
 * @example
 * ```tsx
 * function Chat({ run }: { run: RunSource }) {
 *   const { text, status, costUsd } = useRun(run);
 *   return <pre>{text}{status === "streaming" ? "▍" : ` — $${costUsd.toFixed(4)}`}</pre>;
 * }
 * ```
 */
export function useRun(source: RunSource): RunSnapshot {
  const store = useMemo(() => createRunStore(source.events), [source]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/**
 * Track a run's structured output as it streams.
 *
 * @param source - A {@link RunSource} whose run emits `object.delta` / `object.final` events.
 * @returns `{ partial, value }` — `partial` is the latest in-flight object (from `object.delta`),
 * `value` is the finalized object (from `object.final`); each is `undefined` until seen.
 */
export function useObject(source: RunSource): { readonly partial: JsonValue | undefined; readonly value: JsonValue | undefined } {
  const snap = useRun(source);
  let partial: JsonValue | undefined;
  let value: JsonValue | undefined;
  for (const e of snap.events) {
    if (e.type === "object.delta") partial = e.partial;
    if (e.type === "object.final") value = e.value;
  }
  return { partial, value };
}
