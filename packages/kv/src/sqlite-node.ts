import { DatabaseSync } from "node:sqlite";
import type { KeyValue } from "./index.ts";

// Durable KeyValue over node:sqlite (Node >= 22.5) — the server-side counterpart of the browser IndexedDB
// backend. Values are stored as JSON; TTL is enforced lazily on read (an expired row is deleted when next
// touched). Passes kvConformance.

interface Row {
  readonly value: string;
  readonly expires: number | null;
}

/**
 * Creates a durable {@link KeyValue} store backed by `node:sqlite` (Node >= 22.5, no native dependency).
 *
 * @param opts - `path` (SQLite file; defaults to `":memory:"`) and `now` (clock injection for deterministic
 *   TTL in tests; defaults to `Date.now`).
 * @returns A {@link KeyValue} persisted to SQLite, with the same TTL semantics as {@link memoryKv}.
 * @remarks The server-durable counterpart to the browser-only IndexedDB backend. Values are JSON-serialized;
 * expiry is lazy (an entry is evicted the next time it is read after its expiry). Passes `kvConformance`.
 * @example
 * ```ts
 * import { sqliteNodeKv } from "@mithril/kv/sqlite-node";
 *
 * const kv = sqliteNodeKv({ path: "./cache.db" });
 * await kv.set("user:1", { name: "Ada" }, { ttlMs: 60_000 });
 * ```
 */
export function sqliteNodeKv(opts?: { readonly path?: string; readonly now?: () => number }): KeyValue {
  const path = opts?.path ?? ":memory:";
  const now = opts?.now ?? ((): number => Date.now());
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER)");
  const read = db.prepare("SELECT value, expires FROM kv WHERE key = ?");
  const write = db.prepare(
    "INSERT INTO kv (key, value, expires) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires = excluded.expires",
  );
  const remove = db.prepare("DELETE FROM kv WHERE key = ?");
  const live = (key: string): Row | undefined => {
    const row = read.get(key) as Row | undefined;
    if (row === undefined) return undefined;
    if (row.expires !== null && row.expires <= now()) {
      remove.run(key);
      return undefined;
    }
    return row;
  };
  return {
    async get<T = unknown>(key: string): Promise<T | undefined> {
      const row = live(key);
      return row === undefined ? undefined : (JSON.parse(row.value) as T);
    },
    async set(key, value, o): Promise<void> {
      write.run(key, JSON.stringify(value), o?.ttlMs !== undefined ? now() + o.ttlMs : null);
    },
    async delete(key): Promise<void> {
      remove.run(key);
    },
    async has(key): Promise<boolean> {
      return live(key) !== undefined;
    },
  };
}
