import { expect, test } from "bun:test";
import { vectorsConformance } from "../src/index.ts";
import { sqliteBunVectorStore } from "../src/sqlite-bun.ts";

// The durable backend must satisfy the SAME conformance suite as the in-memory reference.
vectorsConformance(async () => sqliteBunVectorStore(":memory:"), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b),
  assertTrue: (v, m) => expect(v, m).toBe(true),
});

test("sqliteBunVectorStore persists across store instances on the same file", async () => {
  const path = `/tmp/mithril-vectors-${Math.floor(performance.now())}-${process.pid}.db`;
  const writer = sqliteBunVectorStore(path);
  await writer.upsert([{ id: "a", vector: [1, 0, 0], metadata: { doc: "x" } }]);

  // A fresh store over the same file sees the persisted vector.
  const reader = sqliteBunVectorStore(path);
  expect(await reader.size()).toBe(1);
  const [hit] = await reader.query([1, 0, 0], { topK: 1 });
  expect(hit?.id).toBe("a");
  expect(hit?.metadata).toEqual({ doc: "x" });
});

test("sqliteBunVectorStore accepts an options object { path }", async () => {
  const s = sqliteBunVectorStore({ path: ":memory:" });
  await s.upsert([{ id: "a", vector: [1, 0], metadata: {} }]);
  expect(await s.size()).toBe(1);
});
