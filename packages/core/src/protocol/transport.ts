import type { MithrilEvent } from "./events.ts";

// §4.1 — gap-detecting cross-runtime transport (web standards only).
/**
 * A gap-detecting, cross-runtime event bus built on web standards only.
 *
 * @remarks
 * `subscribe` returns an unsubscribe function. A `resumeFrom` seq lets a late
 * subscriber replay retained events before receiving live ones.
 */
export interface EventTransport {
  publish(e: MithrilEvent): void;
  subscribe(onEvent: (e: MithrilEvent) => void, resumeFrom?: number): () => void;
}

/**
 * Create an in-memory fan-out {@link EventTransport} backed by a retained log.
 *
 * @returns A transport whose late subscribers catch up gap-free from `resumeFrom`.
 *
 * @example
 * ```ts
 * const bus = inMemoryTransport();
 * const off = bus.subscribe((e) => console.log(e.seq), 0);
 * bus.publish(event);
 * off();
 * ```
 */
export function inMemoryTransport(): EventTransport {
  const log: MithrilEvent[] = [];
  const listeners = new Set<(e: MithrilEvent) => void>();
  return {
    publish(e) {
      log.push(e);
      for (const fn of listeners) fn(e);
    },
    subscribe(onEvent, resumeFrom) {
      if (resumeFrom !== undefined) {
        for (const e of log) {
          if (e.seq >= resumeFrom) onEvent(e);
        }
      }
      listeners.add(onEvent);
      return () => {
        listeners.delete(onEvent);
      };
    },
  };
}

/** The result of {@link assertContiguous}: either contiguous, or the first missing `seq`. */
export type ContiguityResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly missingFrom: number };

/**
 * Check whether `e` immediately follows the previously-seen `seq`.
 *
 * @param prev - The last-seen `seq`; `prev < 0` means nothing seen yet.
 * @param e - The next event.
 * @returns `{ ok: true }` when contiguous, else `{ ok: false, missingFrom }`
 * naming the first missing `seq`.
 */
export function assertContiguous(prev: number, e: MithrilEvent): ContiguityResult {
  const expected = prev + 1;
  if (e.seq === expected) return { ok: true };
  return { ok: false, missingFrom: expected };
}
