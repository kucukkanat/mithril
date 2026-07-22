import { DatabaseSync } from "node:sqlite";
import { cosineSimilarity, type VectorMatch, type VectorStore } from "./index.ts";

// Durable VectorStore over node:sqlite (Node >= 22.5). Vectors + metadata are JSON columns; the cosine ranking
// is an exact brute-force scan in JS (like memoryVectorStore, but persisted) — the Node counterpart of
// sqliteBunVectorStore. Passes vectorsConformance.

interface Row {
  readonly id: string;
  readonly vector: string;
  readonly metadata: string | null;
}

function matchesFilter(metadata: Readonly<Record<string, unknown>> | undefined, filter: Readonly<Record<string, unknown>>): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (metadata?.[k] !== v) return false;
  }
  return true;
}

/**
 * Create a durable {@link VectorStore} backed by `node:sqlite` (Node >= 22.5, no native dependency).
 *
 * @param pathOrOpts - the SQLite file path, or `{ path }`; defaults to `":memory:"` (process-lifetime).
 *   Pass a file path to persist across restarts.
 * @returns a {@link VectorStore} with the same semantics as `memoryVectorStore`, persisted to SQLite.
 * @remarks The Node counterpart of `sqliteBunVectorStore` — same schema, idempotent `upsert` via
 * `ON CONFLICT(id) DO UPDATE`, and an **exact** brute-force cosine scan (not ANN). Passes `vectorsConformance`.
 * @example
 * ```ts
 * import { sqliteNodeVectorStore } from "@mithril/vectors/sqlite-node";
 *
 * const store = sqliteNodeVectorStore("./embeddings.db"); // durable across restarts, on Node
 * ```
 */
export function sqliteNodeVectorStore(pathOrOpts?: string | { readonly path?: string }): VectorStore {
  const path = (typeof pathOrOpts === "string" ? pathOrOpts : pathOrOpts?.path) ?? ":memory:";
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, vector TEXT NOT NULL, metadata TEXT)");
  const upsert = db.prepare(
    "INSERT INTO vectors (id, vector, metadata) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET vector = excluded.vector, metadata = excluded.metadata",
  );
  const selectAll = db.prepare("SELECT id, vector, metadata FROM vectors");
  const remove = db.prepare("DELETE FROM vectors WHERE id = ?");
  const count = db.prepare("SELECT COUNT(*) AS n FROM vectors");
  return {
    async upsert(records): Promise<void> {
      for (const r of records) {
        upsert.run(r.id, JSON.stringify(Array.from(r.vector)), r.metadata !== undefined ? JSON.stringify(r.metadata) : null);
      }
    },
    async query(vector, opts): Promise<readonly VectorMatch[]> {
      const topK = opts?.topK ?? 10;
      const filter = opts?.filter;
      const hits: VectorMatch[] = [];
      for (const row of selectAll.all() as unknown as Row[]) {
        const metadata = row.metadata !== null ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined;
        if (filter !== undefined && !matchesFilter(metadata, filter)) continue;
        const vec = JSON.parse(row.vector) as number[];
        hits.push({ id: row.id, score: cosineSimilarity(vector, vec), ...(metadata !== undefined ? { metadata } : {}) });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, topK);
    },
    async delete(ids): Promise<void> {
      for (const id of ids) remove.run(id);
    },
    async size(): Promise<number> {
      return (count.get() as { n: number } | undefined)?.n ?? 0;
    },
  };
}
