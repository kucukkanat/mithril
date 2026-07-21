import type { EventConsumer } from "../protocol/index.ts";

// §9.2 zero-touch attach seam. A process-wide set of EventConsumers that every run fans out to, so devtools
// can attach "by being present" (import "mithril/devtools/attach") with no per-run wiring. This is the ONLY
// concession to global state in the loop — it is additive (empty ⇒ no-op) and purely observational: consumers
// still only read stamped events, exactly like a `use:`-supplied consumer.

const registered = new Set<EventConsumer>();
const EMPTY: readonly EventConsumer[] = [];

/**
 * Register an {@link EventConsumer} that receives events from **every** run in this process.
 *
 * @param consumer - the consumer to fan every run's events out to.
 * @returns an unregister function; call it to stop receiving events.
 * @remarks The mechanism behind zero-touch devtools attach (`import "mithril/devtools/attach"`). Consumers are
 * observational only — they read stamped {@link MithrilEvent}s, never the loop. Prefer a per-agent `use:`
 * consumer for scoped observation; use this only for cross-cutting, whole-process tooling.
 * @example
 * ```ts
 * import { registerGlobalConsumer } from "@mithril/core/agent";
 *
 * const off = registerGlobalConsumer({ name: "log", onEvent: (e) => console.log(e.type) });
 * // …every run now logs; later:
 * off();
 * ```
 */
export function registerGlobalConsumer(consumer: EventConsumer): () => void {
  registered.add(consumer);
  return () => {
    registered.delete(consumer);
  };
}

/** The currently-registered global consumers (empty array when none — a cheap no-op fast path). */
export function globalConsumers(): readonly EventConsumer[] {
  return registered.size === 0 ? EMPTY : [...registered];
}
