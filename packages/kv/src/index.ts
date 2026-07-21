/**
 * Runtime-agnostic key-value store for Mithril tools — the {@link KeyValue} interface, an in-memory impl,
 * and a conformance kit.
 *
 * @packageDocumentation
 */

// §10.2 — runtime-agnostic KeyValue for tools (caches, dedup sets, counters, scratch state). Injected via
// Deps (ctx.deps.kv). The in-memory impl works everywhere; indexeddb/sqlite/workerd-KV follow the same
// interface behind explicit per-runtime subpaths.

/**
 * A runtime-agnostic async key-value store (§10.2) for tools — caches, dedup sets, counters, scratch state.
 *
 * @remarks
 * Injected into tools via `Deps` (`ctx.deps.kv`). Implementations must pass {@link kvConformance};
 * {@link memoryKv} is the reference in-memory impl, with indexeddb/sqlite/workerd-KV backends behind
 * per-runtime subpaths.
 */
export interface KeyValue {
  /**
   * Reads the value at `key`, or `undefined` if absent or expired.
   * @typeParam T - Expected value type; the stored value is cast to `T` (unchecked).
   */
  get<T = unknown>(key: string): Promise<T | undefined>;
  /**
   * Writes `value` at `key`, overwriting any existing entry.
   * @param opts - Optional `{ ttlMs }` — expire the entry that many milliseconds from now (a key is treated
   *   as expired once its expiry is `<=` the current time, so `ttlMs: 0` expires immediately). Omit for no
   *   expiry.
   */
  set(key: string, value: unknown, opts?: { readonly ttlMs?: number }): Promise<void>;
  /** Removes `key` if present; a no-op otherwise. */
  delete(key: string): Promise<void>;
  /** Returns `true` if `key` exists and has not expired. */
  has(key: string): Promise<boolean>;
}

interface Entry {
  readonly value: unknown;
  readonly expires: number | null;
}

/**
 * Creates an in-memory {@link KeyValue} store backed by a `Map`, with lazy TTL expiry on read.
 *
 * @param now - Clock injection returning the current epoch-ms; defaults to `Date.now`. Override it to drive
 *   TTL deterministically in tests.
 * @returns A fresh {@link KeyValue} with no shared state.
 *
 * @remarks
 * Works in every runtime and is the reference implementation for {@link kvConformance}. Expiry is lazy:
 * an expired entry is evicted the next time it is read via `get`/`has`, not on a timer.
 *
 * @example
 * ```ts
 * const kv = memoryKv();
 * await kv.set("user:1", { name: "Ada" }, { ttlMs: 60_000 });
 * await kv.get<{ name: string }>("user:1"); // → { name: "Ada" } (until it expires)
 * ```
 */
export function memoryKv(now: () => number = Date.now): KeyValue {
  const store = new Map<string, Entry>();
  const live = (key: string): Entry | undefined => {
    const e = store.get(key);
    if (e === undefined) return undefined;
    if (e.expires !== null && e.expires <= now()) {
      store.delete(key);
      return undefined;
    }
    return e;
  };
  return {
    async get<T>(key: string): Promise<T | undefined> {
      return live(key)?.value as T | undefined;
    },
    async set(key, value, opts) {
      store.set(key, { value, expires: opts?.ttlMs !== undefined ? now() + opts.ttlMs : null });
    },
    async delete(key) {
      store.delete(key);
    },
    async has(key) {
      return live(key) !== undefined;
    },
  };
}

/**
 * Minimal test-runner shim that lets {@link kvConformance} register cases against bun:test / vitest without
 * a hard dependency on either.
 */
export interface KvTestAdapter {
  /** Registers a named test, mirroring bun:test / vitest's `test(name, fn)`. */
  test(name: string, fn: () => void | Promise<void>): void;
  /** Asserts deep equality of `actual` and `expected`. */
  assertEqual(actual: unknown, expected: unknown): void;
}

/**
 * Shared conformance suite that every {@link KeyValue} implementation must pass.
 *
 * @param make - Factory producing a fresh, empty {@link KeyValue} for each test case.
 * @param t - A {@link KvTestAdapter} bridging the suite to a host test runner.
 *
 * @remarks Covers get/set/has/delete roundtrip and TTL expiry. Call it to certify a backend such as
 * {@link memoryKv}.
 *
 * @example
 * ```ts
 * import { test, expect } from "bun:test";
 * kvConformance(async () => memoryKv(), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
 * ```
 */
export function kvConformance(make: () => Promise<KeyValue>, t: KvTestAdapter): void {
  t.test("get/set/has/delete roundtrip", async () => {
    const kv = await make();
    t.assertEqual(await kv.get("a"), undefined);
    await kv.set("a", { n: 1 });
    t.assertEqual(await kv.get("a"), { n: 1 });
    t.assertEqual(await kv.has("a"), true);
    await kv.delete("a");
    t.assertEqual(await kv.has("a"), false);
  });
  t.test("ttl expires a key", async () => {
    const kv = await make();
    await kv.set("t", 1, { ttlMs: 0 }); // expires immediately (expires <= now on read)
    t.assertEqual(await kv.has("t"), false);
  });
}
