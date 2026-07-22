// Exercised by sqlite-node.test.ts via a real Node subprocess (node:sqlite is unavailable under Bun, so the
// backend is verified where it actually runs). Type-only imports are stripped by `--experimental-strip-types`,
// so only node:sqlite loads at runtime. Prints "PASS" on success; a failed assertion throws (non-zero exit).
import assert from "node:assert";
import { sqliteNodeCheckpointer } from "../../src/sqlite-node.ts";

const cp = sqliteNodeCheckpointer(":memory:");
const rec = { runId: "r1", checkpointId: "c1", parentId: null, token: "TOK", status: "suspended", createdAt: "1970-01-01T00:00:00.000Z" };

assert.equal(await cp.put(rec), "ok");
assert.equal((await cp.latest("r1"))?.token, "TOK");
assert.equal((await cp.get("r1", "c1"))?.status, "suspended");
assert.equal(await cp.put(rec), "ok"); // idempotent (INSERT OR IGNORE)
assert.equal(await cp.put({ ...rec, checkpointId: "c2", parentId: "c1" }, { ifParent: "c1" }), "ok");
assert.equal(await cp.put({ ...rec, checkpointId: "c3" }, { ifParent: "c1" }), "conflict"); // latest is c2 now

const hist: string[] = [];
for await (const h of cp.history("r1")) hist.push(h.checkpointId);
assert.deepEqual(hist, ["c1", "c2"]);

await cp.purge("r1");
assert.equal(await cp.latest("r1"), undefined);

console.log("PASS");
