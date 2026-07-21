import type { KeyValue } from "./index.ts";

// §10.2 — browser KeyValue over IndexedDB. Same interface + conformance as memoryKv; persists per-origin
// across sessions. TTL is stored alongside each value and enforced lazily on read (same semantics as
// memoryKv). Type-checks against the DOM lib; verify in a real browser (there is no IndexedDB in Node/Bun).

// Promise-wrap an IDBRequest.
function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = (): void => resolve(r.result);
    r.onerror = (): void => reject(r.error);
  });
}

interface Entry {
  readonly value: unknown;
  readonly expires: number | null;
}

/**
 * Create a {@link KeyValue} backed by the browser's IndexedDB.
 *
 * @param opts - `dbName` (default `"mithril-kv"`) and `storeName` (default `"kv"`) name the database and
 *   object store; `now` injects the clock (default `Date.now`) for deterministic TTL in tests.
 * @returns A persistent, per-origin {@link KeyValue}.
 * @remarks **Browser-only** — requires the `indexedDB` global. Passes the same {@link kvConformance} suite
 * as {@link memoryKv}. Expiry is lazy: an expired entry is evicted the next time it is read.
 * @example
 * ```ts
 * const kv = indexedDbKv();
 * await kv.set("session", { token }, { ttlMs: 3_600_000 });
 * ```
 */
export function indexedDbKv(opts?: {
  readonly dbName?: string;
  readonly storeName?: string;
  readonly now?: () => number;
}): KeyValue {
  const dbName = opts?.dbName ?? "mithril-kv";
  const storeName = opts?.storeName ?? "kv";
  const now = opts?.now ?? Date.now;
  let dbP: Promise<IDBDatabase> | undefined;

  const db = (): Promise<IDBDatabase> => {
    if (dbP === undefined) {
      dbP = new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open(dbName, 1);
        open.onupgradeneeded = (): void => {
          open.result.createObjectStore(storeName);
        };
        open.onsuccess = (): void => resolve(open.result);
        open.onerror = (): void => reject(open.error);
      });
    }
    return dbP;
  };
  const store = async (mode: IDBTransactionMode): Promise<IDBObjectStore> =>
    (await db()).transaction(storeName, mode).objectStore(storeName);

  const live = async (key: string): Promise<Entry | undefined> => {
    const e = await req<Entry | undefined>((await store("readonly")).get(key));
    if (e === undefined) return undefined;
    if (e.expires !== null && e.expires <= now()) {
      await req((await store("readwrite")).delete(key));
      return undefined;
    }
    return e;
  };

  return {
    async get<T>(key: string): Promise<T | undefined> {
      return (await live(key))?.value as T | undefined;
    },
    async set(key, value, o): Promise<void> {
      const entry: Entry = { value, expires: o?.ttlMs !== undefined ? now() + o.ttlMs : null };
      await req((await store("readwrite")).put(entry, key));
    },
    async delete(key): Promise<void> {
      await req((await store("readwrite")).delete(key));
    },
    async has(key): Promise<boolean> {
      return (await live(key)) !== undefined;
    },
  };
}
