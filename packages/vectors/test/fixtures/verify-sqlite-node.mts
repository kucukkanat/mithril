// Run by sqlite-node.test.ts via a real Node subprocess. Prints "PASS" on success.
import assert from "node:assert";
import { sqliteNodeVectorStore } from "../../src/sqlite-node.ts";

const s = sqliteNodeVectorStore(":memory:");
await s.upsert([
  { id: "a", vector: [1, 0, 0], metadata: { doc: "x" } },
  { id: "b", vector: [0, 1, 0], metadata: { doc: "y" } },
]);
assert.equal(await s.size(), 2);

const hits = await s.query([0.9, 0.1, 0], { topK: 1 });
assert.equal(hits[0]?.id, "a");
assert.equal((hits[0]?.metadata as { doc: string }).doc, "x");

const filtered = await s.query([0.5, 0.5, 0], { filter: { doc: "y" } });
assert.equal(filtered.length, 1);
assert.equal(filtered[0]?.id, "b");

await s.upsert([{ id: "a", vector: [0, 0, 1] }]); // overwrite, not insert
assert.equal(await s.size(), 2);
await s.delete(["a"]);
assert.equal(await s.size(), 1);
console.log("PASS");
