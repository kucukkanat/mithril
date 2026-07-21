/**
 * Checkpointers for Mithril agent runs — the in-memory reference impl plus the conformance kit every
 * backend must pass.
 *
 * @packageDocumentation
 */

import type { Checkpointer, CheckpointRecord, TestAdapter } from "@mithril/core/protocol";

// In-memory Checkpointer — works in every runtime; the reference impl for the conformance kit. Durable
// backends (sqlite/opfs/kv) follow the same interface behind explicit per-runtime subpaths.

/**
 * Creates an in-memory {@link Checkpointer} — records are held in a `Map` keyed by run id and lost on
 * process exit.
 *
 * @returns A fresh {@link Checkpointer} with no shared state.
 *
 * @remarks
 * Works in every runtime and is the reference implementation the conformance kit
 * ({@link checkpointerConformance}) is written against. `put` is idempotent on `checkpointId` and, when
 * `opts.ifParent` is supplied, guards optimistic concurrency by returning `"conflict"` if it does not match
 * the latest checkpoint. For durability across restarts use a persistent backend such as
 * {@link sqliteBunCheckpointer}.
 *
 * @example
 * ```ts
 * const cp = memoryCheckpointer();
 * await cp.put({ runId: "r1", checkpointId: "c1", parentId: null, token: "…", status: "suspended", createdAt: new Date().toISOString() });
 * const latest = await cp.latest("r1"); // → the "c1" record
 * ```
 */
export function memoryCheckpointer(): Checkpointer {
  const byRun = new Map<string, CheckpointRecord[]>();
  return {
    async put(rec, opts) {
      const list = byRun.get(rec.runId) ?? [];
      if (opts?.ifParent !== undefined) {
        const latestId = list.length > 0 ? (list[list.length - 1]?.checkpointId ?? null) : null;
        if (opts.ifParent !== latestId) return "conflict";
      }
      if (list.some((r) => r.checkpointId === rec.checkpointId)) return "ok"; // idempotent
      list.push(rec);
      byRun.set(rec.runId, list);
      return "ok";
    },
    async latest(runId) {
      const list = byRun.get(runId);
      return list !== undefined && list.length > 0 ? list[list.length - 1] : undefined;
    },
    async get(runId, checkpointId) {
      return byRun.get(runId)?.find((r) => r.checkpointId === checkpointId);
    },
    async *history(runId) {
      for (const r of byRun.get(runId) ?? []) yield r;
    },
    async purge(runId) {
      byRun.delete(runId);
    },
  };
}

// §10 — every Checkpointer impl must pass this. Bridged to bun:test/vitest via a tiny TestAdapter.

/**
 * Shared conformance suite (§10) that every {@link Checkpointer} implementation must pass.
 *
 * @param make - Factory producing a fresh, empty {@link Checkpointer} for each test case.
 * @param t - A {@link TestAdapter} bridging the suite to a host test runner (bun:test / vitest).
 *
 * @remarks
 * Registers cases covering roundtrip + `latest`, insertion-order `history`, `ifParent` optimistic-concurrency
 * guarding, `put` idempotency on `checkpointId`, and `purge`. Call it from a test file to certify a backend
 * such as {@link memoryCheckpointer} or {@link sqliteBunCheckpointer}.
 *
 * @example
 * ```ts
 * import { test } from "bun:test";
 * checkpointerConformance(async () => memoryCheckpointer(), {
 *   test,
 *   assertEqual: (a, b) => expect(a).toEqual(b),
 * });
 * ```
 */
export function checkpointerConformance(make: () => Promise<Checkpointer>, t: TestAdapter): void {
  const rec = (runId: string, checkpointId: string, parentId: string | null = null): CheckpointRecord => ({
    runId,
    checkpointId,
    parentId,
    token: `token-${checkpointId}`,
    status: "suspended",
    createdAt: "1970-01-01T00:00:00.000Z",
  });

  t.test("roundtrip + latest", async () => {
    const cp = await make();
    await cp.put(rec("r", "c1"));
    t.assertEqual((await cp.latest("r"))?.checkpointId, "c1");
    t.assertEqual((await cp.get("r", "c1"))?.token, "token-c1");
  });

  t.test("history is in insertion order", async () => {
    const cp = await make();
    await cp.put(rec("r", "c1"));
    await cp.put(rec("r", "c2", "c1"));
    const ids: string[] = [];
    for await (const r of cp.history("r")) ids.push(r.checkpointId);
    t.assertEqual(ids, ["c1", "c2"]);
  });

  t.test("ifParent guards optimistic concurrency", async () => {
    const cp = await make();
    await cp.put(rec("r", "c1"));
    t.assertEqual(await cp.put(rec("r", "c2", "wrong"), { ifParent: "wrong" }), "conflict");
    t.assertEqual(await cp.put(rec("r", "c2", "c1"), { ifParent: "c1" }), "ok");
  });

  t.test("put is idempotent on checkpointId", async () => {
    const cp = await make();
    await cp.put(rec("r", "c1"));
    await cp.put(rec("r", "c1"));
    let n = 0;
    for await (const _ of cp.history("r")) n++;
    t.assertEqual(n, 1);
  });

  t.test("purge removes a run", async () => {
    const cp = await make();
    await cp.put(rec("r", "c1"));
    await cp.purge("r");
    t.assertEqual(await cp.latest("r"), undefined);
  });
}
