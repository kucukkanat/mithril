import { DatabaseSync } from "node:sqlite";
import type { Checkpointer, CheckpointRecord } from "@mithril/core/protocol";

// Durable Checkpointer over node:sqlite (Node >= 22.5, the built-in SQLite). Same interface and semantics as
// sqliteBunCheckpointer; tokens are bound as opaque parameters, never interpolated.
interface Row {
  readonly run_id: string;
  readonly checkpoint_id: string;
  readonly parent_id: string | null;
  readonly token: string | null;
  readonly status: string;
  readonly created_at: string;
  readonly seq: number;
}

const toRecord = (r: Row): CheckpointRecord => ({
  runId: r.run_id,
  checkpointId: r.checkpoint_id,
  parentId: r.parent_id,
  token: r.token,
  status: r.status,
  createdAt: r.created_at,
});

/**
 * Creates a durable {@link Checkpointer} backed by `node:sqlite` (Node >= 22.5, no native dependency).
 *
 * @param pathOrOpts - the SQLite database file path, or `{ path }`. Defaults to `":memory:"`
 *   (process-lifetime only); pass a file path for persistence across restarts.
 * @returns A {@link Checkpointer} with the same semantics as {@link memoryCheckpointer}, persisted to SQLite.
 *
 * @remarks
 * The Node counterpart of `sqliteBunCheckpointer` — identical schema, idempotent `put` via `INSERT OR IGNORE`,
 * and `ifParent` optimistic-concurrency conflicts short-circuiting with `"conflict"`. Tokens are bound as
 * opaque parameters, never interpolated. Passes `checkpointerConformance`.
 *
 * @example
 * ```ts
 * import { sqliteNodeCheckpointer } from "@mithril/memory/sqlite-node";
 *
 * const cp = sqliteNodeCheckpointer("./runs.db"); // durable across restarts, on Node
 * ```
 */
export function sqliteNodeCheckpointer(pathOrOpts?: string | { readonly path?: string }): Checkpointer {
  const path = (typeof pathOrOpts === "string" ? pathOrOpts : pathOrOpts?.path) ?? ":memory:";
  const db = new DatabaseSync(path);
  db.exec(
    `CREATE TABLE IF NOT EXISTS checkpoints (
       run_id TEXT NOT NULL, checkpoint_id TEXT NOT NULL, parent_id TEXT, token TEXT,
       status TEXT NOT NULL, created_at TEXT NOT NULL, seq INTEGER PRIMARY KEY AUTOINCREMENT,
       UNIQUE(run_id, checkpoint_id)
     )`,
  );
  const latestId = db.prepare("SELECT checkpoint_id FROM checkpoints WHERE run_id = ? ORDER BY seq DESC LIMIT 1");
  const insert = db.prepare(
    "INSERT OR IGNORE INTO checkpoints (run_id, checkpoint_id, parent_id, token, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const latestRow = db.prepare("SELECT * FROM checkpoints WHERE run_id = ? ORDER BY seq DESC LIMIT 1");
  const getRow = db.prepare("SELECT * FROM checkpoints WHERE run_id = ? AND checkpoint_id = ?");
  const historyRows = db.prepare("SELECT * FROM checkpoints WHERE run_id = ? ORDER BY seq ASC");
  const purgeRun = db.prepare("DELETE FROM checkpoints WHERE run_id = ?");
  return {
    async put(rec, opts) {
      if (opts?.ifParent !== undefined) {
        const latest = (latestId.get(rec.runId) as { checkpoint_id: string } | undefined)?.checkpoint_id ?? null;
        if (opts.ifParent !== latest) return "conflict";
      }
      insert.run(rec.runId, rec.checkpointId, rec.parentId, rec.token, rec.status, rec.createdAt);
      return "ok";
    },
    async latest(runId) {
      const r = latestRow.get(runId) as Row | undefined;
      return r === undefined ? undefined : toRecord(r);
    },
    async get(runId, checkpointId) {
      const r = getRow.get(runId, checkpointId) as Row | undefined;
      return r === undefined ? undefined : toRecord(r);
    },
    async *history(runId) {
      for (const r of historyRows.all(runId) as unknown as Row[]) yield toRecord(r);
    },
    async purge(runId) {
      purgeRun.run(runId);
    },
  };
}
