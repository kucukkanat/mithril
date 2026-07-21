import { Database } from "bun:sqlite";
import type { Checkpointer, CheckpointRecord } from "@mithril/core/protocol";

// Durable Checkpointer over bun:sqlite (Bun runtime). Same interface as memoryCheckpointer; tokens are
// bound as opaque blob parameters, never interpolated.
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
 * Creates a durable {@link Checkpointer} backed by `bun:sqlite` (Bun runtime only).
 *
 * @param path - SQLite database file path. Defaults to `":memory:"` (process-lifetime only); pass a file
 *   path for persistence across restarts.
 * @returns A {@link Checkpointer} with the same semantics as {@link memoryCheckpointer}, persisted to SQLite.
 *
 * @remarks
 * The `checkpoints` table is created on construction if absent, with `UNIQUE(run_id, checkpoint_id)` so
 * `put` is idempotent via `INSERT OR IGNORE`; `ifParent` optimistic-concurrency conflicts are detected
 * before insert and short-circuit with `"conflict"`. Tokens are bound as opaque parameters, never
 * interpolated. Passes {@link checkpointerConformance}.
 *
 * @example
 * ```ts
 * const cp = sqliteBunCheckpointer("./runs.db"); // durable across restarts
 * await cp.put({ runId: "r1", checkpointId: "c1", parentId: null, token: "…", status: "suspended", createdAt: new Date().toISOString() });
 * ```
 */
export function sqliteBunCheckpointer(path = ":memory:"): Checkpointer {
  const db = new Database(path);
  db.run(
    `CREATE TABLE IF NOT EXISTS checkpoints (
       run_id TEXT NOT NULL, checkpoint_id TEXT NOT NULL, parent_id TEXT, token TEXT,
       status TEXT NOT NULL, created_at TEXT NOT NULL, seq INTEGER PRIMARY KEY AUTOINCREMENT,
       UNIQUE(run_id, checkpoint_id)
     )`,
  );
  const latestId = db.query<{ checkpoint_id: string } | null, [string]>(
    "SELECT checkpoint_id FROM checkpoints WHERE run_id = ? ORDER BY seq DESC LIMIT 1",
  );
  return {
    async put(rec, opts) {
      if (opts?.ifParent !== undefined) {
        const latest = latestId.get(rec.runId)?.checkpoint_id ?? null;
        if (opts.ifParent !== latest) return "conflict";
      }
      db.run(
        "INSERT OR IGNORE INTO checkpoints (run_id, checkpoint_id, parent_id, token, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [rec.runId, rec.checkpointId, rec.parentId, rec.token, rec.status, rec.createdAt],
      );
      return "ok";
    },
    async latest(runId) {
      const r = db.query<Row, [string]>("SELECT * FROM checkpoints WHERE run_id = ? ORDER BY seq DESC LIMIT 1").get(runId);
      return r === null ? undefined : toRecord(r);
    },
    async get(runId, checkpointId) {
      const r = db.query<Row, [string, string]>("SELECT * FROM checkpoints WHERE run_id = ? AND checkpoint_id = ?").get(runId, checkpointId);
      return r === null ? undefined : toRecord(r);
    },
    async *history(runId) {
      for (const r of db.query<Row, [string]>("SELECT * FROM checkpoints WHERE run_id = ? ORDER BY seq ASC").all(runId)) {
        yield toRecord(r);
      }
    },
    async purge(runId) {
      db.run("DELETE FROM checkpoints WHERE run_id = ?", [runId]);
    },
  };
}
