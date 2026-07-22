# @mithril/vectors

Runtime-agnostic **vector store** — the portable core of retrieval-augmented generation (RAG). A tiny
interface (`upsert` / `query` / `delete` / `size`), an in-memory brute-force implementation that runs
everywhere (including the browser), and a conformance kit so every backend behaves identically.

Embeddings are the caller's job — a `VectorStore` persists and searches vectors; it doesn't compute them.

## Install

Part of the Mithril monorepo — source-as-published ESM, zero runtime dependencies.

## Usage

```ts
import { memoryVectorStore } from "@mithril/vectors";

const store = memoryVectorStore();

await store.upsert([
  { id: "intro", vector: [1, 0, 0], metadata: { doc: "guide", section: "intro" } },
  { id: "setup", vector: [0, 1, 0], metadata: { doc: "guide", section: "setup" } },
]);

// nearest neighbours by cosine similarity, most similar first
const hits = await store.query([0.9, 0.1, 0], { topK: 1 });
// → [{ id: "intro", score: ~0.99, metadata: { doc: "guide", section: "intro" } }]

// metadata filtering (shallow equality on every key)
const setupOnly = await store.query([0, 1, 0], { filter: { section: "setup" } });
```

Wire it into tools via `Deps`:

```ts
type Deps = { readonly vectors: VectorStore };

const search = tool<Deps>()({
  name: "search_docs",
  description: "Find the most relevant docs for a query embedding.",
  inputSchema: /* … */,
  async execute({ embedding }, ctx) {
    return ctx.deps.vectors.query(embedding, { topK: 5 });
  },
});
```

## As a RAG core

The in-memory store does an **exact** brute-force scan — ideal for small corpora and tests. For
persistence across process restarts, use the shipped SQLite backend at `@mithril/vectors/sqlite-bun`
(`sqliteBunVectorStore(path)`) — same interface, still an exact scan. For large collections an ANN-indexed
backend (sqlite-vec / pgvector / Cloudflare Vectorize) is on the roadmap; because the interface is
identical, your retrieval code won't change when you swap it in.

## Conformance

Certify any `VectorStore` with the shared suite:

```ts
import { test, expect } from "bun:test";
import { memoryVectorStore, vectorsConformance } from "@mithril/vectors";

vectorsConformance(async () => memoryVectorStore(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b),
  assertTrue: (v) => expect(v).toBe(true),
});
```

## API

- `memoryVectorStore(): VectorStore` — the reference in-memory brute-force store.
- `sqliteBunVectorStore(path? | { path? }): VectorStore` — durable SQLite-backed store (`@mithril/vectors/sqlite-bun`;
  defaults to `:memory:`).
- `sqliteNodeVectorStore(path? | { path? }): VectorStore` — the Node ≥ 22.5 counterpart via built-in
  `node:sqlite` (`@mithril/vectors/sqlite-node`).
- `cosineSimilarity(a, b): number` — cosine similarity in `[-1, 1]` (`0` for a zero-magnitude vector).
- `vectorsConformance(make, adapter)` — the shared conformance suite.
- Types: `VectorStore`, `VectorRecord`, `VectorMatch`, `QueryOptions`.
