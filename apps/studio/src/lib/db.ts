/*
 * Project persistence over @mithril/kv's IndexedDB backend — per-origin, no server. One `index`
 * key holds the ordered project-id list; each project lives at `project:<id>` as a JSON record.
 */
import { indexedDbKv } from "@mithril/kv/indexeddb";
import { migrateProject, type ProjectSpec } from "@mithril/spec";

export interface ProjectRecord {
  readonly id: string;
  readonly spec: ProjectSpec;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ProjectListEntry {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: number;
}

const kv = indexedDbKv({ dbName: "mithril-studio", storeName: "projects" });
const INDEX_KEY = "index";
const key = (id: string): string => `project:${id}`;

const newId = (): string => crypto.randomUUID().slice(0, 8);

async function readIndex(): Promise<readonly string[]> {
  return (await kv.get<readonly string[]>(INDEX_KEY)) ?? [];
}

export async function listProjects(): Promise<readonly ProjectListEntry[]> {
  const ids = await readIndex();
  const entries: ProjectListEntry[] = [];
  for (const id of ids) {
    const rec = await kv.get<ProjectRecord>(key(id));
    if (rec !== undefined) entries.push({ id, name: rec.spec.name, updatedAt: rec.updatedAt });
  }
  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadProject(id: string): Promise<ProjectRecord | undefined> {
  const rec = await kv.get<ProjectRecord>(key(id));
  if (rec === undefined) return undefined;
  // Validate + (in future versions) upgrade on every load — a stored spec may predate this build.
  return { ...rec, spec: migrateProject(rec.spec) };
}

export async function saveProject(id: string, spec: ProjectSpec): Promise<void> {
  const existing = await kv.get<ProjectRecord>(key(id));
  const now = Date.now();
  const rec: ProjectRecord = { id, spec, createdAt: existing?.createdAt ?? now, updatedAt: now };
  await kv.set(key(id), rec);
  const ids = await readIndex();
  if (!ids.includes(id)) await kv.set(INDEX_KEY, [...ids, id]);
}

export async function createProject(spec: ProjectSpec): Promise<string> {
  const id = newId();
  await saveProject(id, spec);
  return id;
}

export async function deleteProject(id: string): Promise<void> {
  await kv.delete(key(id));
  await kv.set(INDEX_KEY, (await readIndex()).filter((x) => x !== id));
}

export async function duplicateProject(id: string): Promise<string | undefined> {
  const rec = await loadProject(id);
  if (rec === undefined) return undefined;
  return createProject({ ...rec.spec, name: `${rec.spec.name} copy` });
}
