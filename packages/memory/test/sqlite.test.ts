import { expect, test } from "bun:test";
import { checkpointerConformance } from "../src/index.ts";
import { sqliteBunCheckpointer } from "../src/sqlite-bun.ts";

// The same conformance suite, now against a real SQLite backend (fresh :memory: db per case).
checkpointerConformance(async () => sqliteBunCheckpointer(":memory:"), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b as never),
});

test("sqlite checkpointer survives a fresh connection to the same db path (durability)", async () => {
  const path = `/tmp/mithril-cp-${Math.floor(performance.now())}.sqlite`;
  const a = sqliteBunCheckpointer(path);
  await a.put({ runId: "r", checkpointId: "c1", parentId: null, token: "T", status: "suspended", createdAt: "1970-01-01T00:00:00.000Z" });
  // a different connection to the same file sees it
  const b = sqliteBunCheckpointer(path);
  expect((await b.latest("r"))?.token).toBe("T");
});
