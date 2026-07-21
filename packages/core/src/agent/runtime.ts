import type { RuntimeAdapter } from "../protocol/index.ts";

/**
 * Build the default {@link RuntimeAdapter} backed by `globalThis` (§3.2).
 *
 * @returns a runtime seam wiring `fetch`, `now`, `randomUUID`, `getRandomValues`, and `subtle` to the
 * platform globals. Use it as the default when no `runtime` is supplied in {@link RunOptions}/{@link LoopOptions}.
 * @remarks `subtle` is feature-detected and may be `undefined` in insecure browser contexts (which is why
 * {@link seal}/{@link open} throw a {@link StateIntegrityError} there); UUIDs and random bytes come from
 * `crypto`, which is always available.
 */
// §3.2 — build a RuntimeAdapter from globalThis. `subtle` is feature-detected (undefined in insecure
// browser contexts); ids come from getRandomValues, which is always available.
export function defaultRuntime(): RuntimeAdapter {
  const g = globalThis;
  return {
    fetch: g.fetch.bind(g),
    now: () => Date.now(),
    randomUUID: () => g.crypto.randomUUID(),
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      // The lib's getRandomValues generic is narrower (ArrayBufferView<ArrayBuffer>) than our seam's
      // `ArrayBufferView | null`; cast the FUNCTION to the looser shape rather than the array (no `any`).
      if (array !== null) (g.crypto.getRandomValues as (a: ArrayBufferView) => ArrayBufferView)(array);
      return array;
    },
    subtle: g.crypto.subtle,
  };
}
