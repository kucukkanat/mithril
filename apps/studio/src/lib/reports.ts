/*
 * Eval run-report history — one IndexedDB store per origin, mirroring lib/db.ts's project store. A
 * report captures a whole matrix run (every model × case SuiteRun) so it can be re-opened, exported, or
 * used as a baseline to diff a later run against. Keyed per project; a `reports:<projectId>` index holds
 * the ordered run-id list.
 */
import { indexedDbKv } from "@mithril/kv/indexeddb";
import type { SuiteRun } from "@mithril/evals";

export interface EvalReportRecord {
  readonly runId: string;
  readonly projectId: string;
  readonly suiteId: string;
  readonly suiteName: string;
  readonly createdAt: number;
  /** Model labels included in the matrix, in run order. */
  readonly models: readonly string[];
  readonly runs: readonly SuiteRun[];
}

export interface ReportListEntry {
  readonly runId: string;
  readonly suiteId: string;
  readonly suiteName: string;
  readonly createdAt: number;
  readonly models: readonly string[];
  readonly passed: number;
  readonly total: number;
}

// A distinct database, not a second store on "mithril-studio": indexedDbKv opens each dbName at version 1
// and only creates its store on first creation, so a second store on an existing db is never created.
const kv = indexedDbKv({ dbName: "mithril-studio-reports", storeName: "reports" });
const indexKey = (projectId: string): string => `reports:${projectId}`;
const recordKey = (projectId: string, runId: string): string => `report:${projectId}:${runId}`;

export const newRunId = (): string => crypto.randomUUID().slice(0, 8);

async function readIndex(projectId: string): Promise<readonly string[]> {
  return (await kv.get<readonly string[]>(indexKey(projectId))) ?? [];
}

export async function saveReport(rec: EvalReportRecord): Promise<void> {
  await kv.set(recordKey(rec.projectId, rec.runId), rec);
  const ids = await readIndex(rec.projectId);
  if (!ids.includes(rec.runId)) await kv.set(indexKey(rec.projectId), [rec.runId, ...ids]);
}

export async function listReports(projectId: string): Promise<readonly ReportListEntry[]> {
  const ids = await readIndex(projectId);
  const entries: ReportListEntry[] = [];
  for (const runId of ids) {
    const rec = await kv.get<EvalReportRecord>(recordKey(projectId, runId));
    if (rec === undefined) continue;
    entries.push({
      runId,
      suiteId: rec.suiteId,
      suiteName: rec.suiteName,
      createdAt: rec.createdAt,
      models: rec.models,
      passed: rec.runs.filter((r) => r.passed).length,
      total: rec.runs.length,
    });
  }
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadReport(projectId: string, runId: string): Promise<EvalReportRecord | undefined> {
  return kv.get<EvalReportRecord>(recordKey(projectId, runId));
}

export async function deleteReport(projectId: string, runId: string): Promise<void> {
  await kv.delete(recordKey(projectId, runId));
  await kv.set(indexKey(projectId), (await readIndex(projectId)).filter((x) => x !== runId));
}
