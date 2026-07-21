import { Database } from "bun:sqlite";
import { cosineSimilarity, type VectorMatch, type VectorStore } from "./index.ts";

// Durable VectorStore over bun:sqlite (Bun runtime). Vectors + metadata are stored as JSON columns; the
// cosine ranking is an exact brute-force scan in JS (like memoryVectorStore, but persisted). This is NOT an
// ANN index — swap in sqlite-vec / pgvector for large corpora; the interface is identical. Passes
// vectorsConformance.

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
 * Create a durable {@link VectorStore} backed by `bun:sqlite` (Bun runtime only).
 *
 * @param path - SQLite file path; defaults to `":memory:"` (process-lifetime). Pass a file path to persist
 *   across restarts.
 * @returns a {@link VectorStore} with the same semantics as `memoryVectorStore`, persisted to SQLite.
 * @remarks The `vectors` table is created on construction. `upsert` is idempotent via
 * `ON CONFLICT(id) DO UPDATE`. Ranking is an **exact** brute-force cosine scan over all rows (not ANN) — ideal
 * up to tens of thousands of vectors; beyond that, move to an ANN-indexed backend behind the same interface.
 * Vectors and metadata are bound as JSON parameters, never interpolated. Passes `vectorsConformance`.
 * @example
 * ```ts
 * import { sqliteBunVectorStore } from "@mithril/vectors/sqlite-bun";
 *
 * const store = sqliteBunVectorStore("./embeddings.db"); // durable across restarts
 * await store.upsert([{ id: "doc-1", vector: embedding, metadata: { source: "faq" } }]);
 * ```
 */
export function sqliteBunVectorStore(path = ":memory:"): VectorStore {
  const db = new Database(path);
  db.run("CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, vector TEXT NOT NULL, metadata TEXT)");
  return {
    async upsert(records): Promise<void> {
      const stmt = db.query("INSERT INTO vectors (id, vector, metadata) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET vector = excluded.vector, metadata = excluded.metadata");
      for (const r of records) {
        stmt.run(r.id, JSON.stringify(Array.from(r.vector)), r.metadata !== undefined ? JSON.stringify(r.metadata) : null);
      }
    },
    async query(vector, opts): Promise<readonly VectorMatch[]> {
      const topK = opts?.topK ?? 10;
      const filter = opts?.filter;
      const hits: VectorMatch[] = [];
      for (const row of db.query<Row, []>("SELECT id, vector, metadata FROM vectors").all()) {
        const metadata = row.metadata !== null ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined;
        if (filter !== undefined && !matchesFilter(metadata, filter)) continue;
        const vec = JSON.parse(row.vector) as number[];
        hits.push({ id: row.id, score: cosineSimilarity(vector, vec), ...(metadata !== undefined ? { metadata } : {}) });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, topK);
    },
    async delete(ids): Promise<void> {
      const stmt = db.query("DELETE FROM vectors WHERE id = ?");
      for (const id of ids) stmt.run(id);
    },
    async size(): Promise<number> {
      return db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM vectors").get()?.n ?? 0;
    },
  };
}
