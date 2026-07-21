/**
 * Runtime-agnostic vector store for Mithril — the portable core of retrieval (RAG). The {@link VectorStore}
 * interface, an in-memory brute-force implementation, and a conformance kit.
 *
 * @packageDocumentation
 */

// §10.4 — VectorStore is the portable RAG core. Vectors are Float32Array; the in-memory brute-force impl is
// browser-capable and the reference for the conformance kit. sqlite-vec / pgvector / Vectorize backends
// follow the same interface behind per-runtime subpaths (their ANN indexes replace the brute-force scan).

/** A record written to a {@link VectorStore}: an id, its embedding, and optional JSON-safe metadata. */
export interface VectorRecord {
  readonly id: string;
  readonly vector: ArrayLike<number>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** A single nearest-neighbour hit returned by {@link VectorStore.query}, ordered by descending `score`. */
export interface VectorMatch {
  readonly id: string;
  /** Cosine similarity in `[-1, 1]`; higher is more similar. */
  readonly score: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Options for a {@link VectorStore.query}. */
export interface QueryOptions {
  /** Maximum matches to return (default 10). */
  readonly topK?: number;
  /** Keep only records whose metadata matches every `key: value` pair (shallow equality). */
  readonly filter?: Readonly<Record<string, unknown>>;
}

/**
 * A runtime-agnostic vector store (§10.4) — the portable core of retrieval-augmented generation.
 *
 * @remarks
 * Injected into tools via `Deps` (`ctx.deps.vectors`). Implementations must pass {@link vectorsConformance};
 * {@link memoryVectorStore} is the reference brute-force impl, with sqlite-vec / pgvector / Vectorize backends
 * behind per-runtime subpaths. Embeddings are the caller's responsibility (a store persists and searches
 * vectors; it does not compute them).
 */
export interface VectorStore {
  /** Insert or replace records by id. */
  upsert(records: readonly VectorRecord[]): Promise<void>;
  /** Return the nearest records to `vector` by cosine similarity, most similar first. */
  query(vector: ArrayLike<number>, opts?: QueryOptions): Promise<readonly VectorMatch[]>;
  /** Remove records by id; unknown ids are ignored. */
  delete(ids: readonly string[]): Promise<void>;
  /** The number of stored records. */
  size(): Promise<number>;
}

function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}
function norm(a: ArrayLike<number>): number {
  return Math.sqrt(dot(a, a));
}
/** Cosine similarity of two vectors; `0` when either has zero magnitude. */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

function matchesFilter(metadata: Readonly<Record<string, unknown>> | undefined, filter: Readonly<Record<string, unknown>>): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (metadata?.[k] !== v) return false;
  }
  return true;
}

interface Stored {
  readonly vector: Float32Array;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Create an in-memory {@link VectorStore} that answers queries with an exact brute-force cosine scan.
 *
 * @returns A fresh, browser-capable store with no shared state.
 * @remarks The reference implementation for {@link vectorsConformance}. Exact (not approximate) — every
 * query scans all records, which is ideal for small collections and for tests; swap in an ANN-indexed
 * backend for large corpora. Vectors are copied into `Float32Array` on upsert.
 * @example
 * ```ts
 * const store = memoryVectorStore();
 * await store.upsert([{ id: "a", vector: [1, 0, 0], metadata: { doc: "intro" } }]);
 * const [top] = await store.query([0.9, 0.1, 0], { topK: 1 });
 * ```
 */
export function memoryVectorStore(): VectorStore {
  const store = new Map<string, Stored>();
  return {
    async upsert(records): Promise<void> {
      for (const r of records) {
        store.set(r.id, { vector: Float32Array.from(r.vector), ...(r.metadata !== undefined ? { metadata: r.metadata } : {}) });
      }
    },
    async query(vector, opts): Promise<readonly VectorMatch[]> {
      const topK = opts?.topK ?? 10;
      const filter = opts?.filter;
      const hits: VectorMatch[] = [];
      for (const [id, rec] of store) {
        if (filter !== undefined && !matchesFilter(rec.metadata, filter)) continue;
        hits.push({ id, score: cosineSimilarity(vector, rec.vector), ...(rec.metadata !== undefined ? { metadata: rec.metadata } : {}) });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, topK);
    },
    async delete(ids): Promise<void> {
      for (const id of ids) store.delete(id);
    },
    async size(): Promise<number> {
      return store.size;
    },
  };
}

/**
 * Minimal test-runner shim so {@link vectorsConformance} runs under bun:test / vitest with no hard dependency.
 */
export interface VectorsTestAdapter {
  test(name: string, fn: () => void | Promise<void>): void;
  assertEqual(actual: unknown, expected: unknown): void;
  assertTrue(value: boolean, message?: string): void;
}

/**
 * Shared conformance suite every {@link VectorStore} implementation must pass.
 *
 * @param make - Factory producing a fresh, empty {@link VectorStore} for each case.
 * @param t - A {@link VectorsTestAdapter} bridging the suite to a host test runner.
 * @remarks Covers upsert/size, nearest-neighbour ordering, `topK` truncation, metadata filtering, upsert
 * replacement, and delete.
 * @example
 * ```ts
 * import { test, expect } from "bun:test";
 * vectorsConformance(async () => memoryVectorStore(), {
 *   test,
 *   assertEqual: (a, b) => expect(a).toEqual(b),
 *   assertTrue: (v) => expect(v).toBe(true),
 * });
 * ```
 */
export function vectorsConformance(make: () => Promise<VectorStore>, t: VectorsTestAdapter): void {
  t.test("upsert then query ranks nearest neighbours first", async () => {
    const s = await make();
    await s.upsert([
      { id: "x", vector: [1, 0, 0] },
      { id: "y", vector: [0, 1, 0] },
      { id: "z", vector: [0.9, 0.1, 0] },
    ]);
    t.assertEqual(await s.size(), 3);
    const hits = await s.query([1, 0, 0], { topK: 2 });
    t.assertEqual(hits.length, 2);
    t.assertEqual(hits[0]?.id, "x");
    t.assertEqual(hits[1]?.id, "z");
  });
  t.test("filter keeps only matching metadata", async () => {
    const s = await make();
    await s.upsert([
      { id: "a", vector: [1, 0], metadata: { lang: "en" } },
      { id: "b", vector: [1, 0], metadata: { lang: "fr" } },
    ]);
    const hits = await s.query([1, 0], { filter: { lang: "fr" } });
    t.assertEqual(hits.length, 1);
    t.assertEqual(hits[0]?.id, "b");
  });
  t.test("upsert replaces by id; delete removes", async () => {
    const s = await make();
    await s.upsert([{ id: "a", vector: [1, 0] }]);
    await s.upsert([{ id: "a", vector: [0, 1] }]);
    t.assertEqual(await s.size(), 1);
    const near = await s.query([0, 1], { topK: 1 });
    t.assertTrue((near[0]?.score ?? 0) > 0.99, "replacement vector should be returned");
    await s.delete(["a"]);
    t.assertEqual(await s.size(), 0);
  });
}
