// Run by sqlite-node.test.ts via a real Node subprocess. Prints "PASS" on success.
import assert from "node:assert";
import { sqliteNodeKv } from "../../src/sqlite-node.ts";

let clock = 1000;
const kv = sqliteNodeKv({ now: () => clock });
await kv.set("k", { n: 1 });
assert.deepEqual(await kv.get("k"), { n: 1 });
assert.equal(await kv.has("k"), true);

await kv.set("ttl", "soon", { ttlMs: 100 });
assert.equal(await kv.has("ttl"), true); // now = 1000, expires = 1100
clock = 1101; // past expiry
assert.equal(await kv.has("ttl"), false);
assert.equal(await kv.get("ttl"), undefined);

await kv.delete("k");
assert.equal(await kv.has("k"), false);
console.log("PASS");
