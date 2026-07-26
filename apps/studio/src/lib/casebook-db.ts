/*
 * Casebook persistence — a sibling record to the project, never part of it.
 *
 * Cases live at `cases:<projectId>` in the same IndexedDB store as projects. Deliberately NOT inside
 * ProjectSpec: the spec round-trips through generateProject/parseProject, and a case is not a
 * declaration — putting it there would mean either emitting it into the TypeScript (where it is not
 * code) or teaching the parser to preserve a comment block (a lossless-round-trip hazard for no
 * gain). The trade is that cases do not travel with an exported agent.ts, which is the right call
 * while the export is a runnable file rather than a project archive.
 */
import { indexedDbKv } from "@mithril/kv/indexeddb";
import type { Case } from "./casebook.ts";

const kv = indexedDbKv({ dbName: "mithril-studio", storeName: "projects" });
const key = (projectId: string): string => `cases:${projectId}`;

export async function loadCases(projectId: string): Promise<readonly Case[]> {
  return (await kv.get<readonly Case[]>(key(projectId))) ?? [];
}

export async function saveCases(projectId: string, cases: readonly Case[]): Promise<void> {
  await kv.set(key(projectId), cases);
}

/** Drop a project's casebook. Called alongside deleteProject so nothing is orphaned. */
export async function deleteCases(projectId: string): Promise<void> {
  await kv.delete(key(projectId));
}

export const newCaseId = (): string => `c-${crypto.randomUUID().slice(0, 8)}`;
