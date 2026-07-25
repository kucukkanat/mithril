import type { FileSystem } from "@mithril/fs";
import type { KeyValue } from "@mithril/kv";
import type { ToolDefinition } from "@mithril/core/protocol";

// Durable storage for authored tools, so a toolbox survives past one run.
//
// A `ToolStore` rather than raw kv/fs because `KeyValue` has no `list()` — a kv-backed store must maintain
// its own index, and that bookkeeping has no business inside a meta-tool. Both backends take an already
// constructed adapter, so this module imports kv/fs as TYPES only and stays runtime-agnostic: the caller
// picks `memoryKv`/`indexedDbKv`/`sqliteNodeKv` (or the fs equivalents) for their runtime.

/** Durable storage for authored {@link ToolDefinition}s, partitioned by scope. */
export interface ToolStore {
  load(scope: string): Promise<readonly ToolDefinition[]>;
  save(scope: string, def: ToolDefinition): Promise<void>;
  remove(scope: string, name: string): Promise<void>;
}

/** The record-format version, in the key prefix. */
const DEFAULT_NAMESPACE = "mithril:tools:v1";

function isDefinition(v: unknown): v is ToolDefinition {
  if (v === null || typeof v !== "object") return false;
  const d = v as Partial<ToolDefinition>;
  return typeof d.name === "string" && typeof d.description === "string" && typeof d.digest === "string" && "body" in d;
}

/**
 * A {@link ToolStore} over any {@link KeyValue}.
 *
 * @param kv - the backing store (`memoryKv`, `indexedDbKv`, `sqliteNodeKv`, …).
 * @param opts - `namespace` overrides the key prefix (default `"mithril:tools:v1"`).
 * @returns a scoped tool store.
 *
 * @remarks
 * Keys are `<ns>:<scope>:t:<name>` for records and `<ns>:<scope>:__index` for the name list, because
 * `KeyValue` cannot enumerate. `save` writes the record *before* indexing it, so an interrupted write
 * leaves an unreferenced record rather than an index entry pointing at nothing — a garbage record is
 * invisible, a dangling pointer is a load-time failure.
 *
 * The `v1` in the prefix is the record format. A future incompatible {@link ToolDefinition} shape bumps it
 * and old records simply stop loading; a cache of agent-authored tools does not warrant a migration path.
 *
 * @example
 * ```ts
 * import { memoryKv } from "@mithril/kv";
 * import { kvToolStore } from "@mithril/authoring/persistence";
 *
 * const store = kvToolStore(memoryKv());
 * ```
 */
export function kvToolStore(kv: KeyValue, opts: { readonly namespace?: string } = {}): ToolStore {
  const ns = opts.namespace ?? DEFAULT_NAMESPACE;
  const indexKey = (scope: string): string => `${ns}:${scope}:__index`;
  const recordKey = (scope: string, name: string): string => `${ns}:${scope}:t:${name}`;
  const readIndex = async (scope: string): Promise<string[]> => {
    const raw = await kv.get<unknown>(indexKey(scope));
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  };
  return {
    async load(scope) {
      const out: ToolDefinition[] = [];
      for (const name of await readIndex(scope)) {
        const rec = await kv.get<unknown>(recordKey(scope, name));
        // A missing or malformed record is skipped, not thrown: a stale cache must never fail a run.
        if (isDefinition(rec)) out.push(rec);
      }
      return out;
    },
    async save(scope, def) {
      await kv.set(recordKey(scope, def.name), def);
      const index = await readIndex(scope);
      if (!index.includes(def.name)) await kv.set(indexKey(scope), [...index, def.name]);
    },
    async remove(scope, name) {
      const index = await readIndex(scope);
      if (index.includes(name)) await kv.set(indexKey(scope), index.filter((n) => n !== name));
      await kv.delete(recordKey(scope, name));
    },
  };
}

/**
 * A {@link ToolStore} over any {@link FileSystem}, one JSON file per tool.
 *
 * @param fs - the backing filesystem (`memoryFileSystem`, `nodeFileSystem`, `opfsFileSystem`).
 * @param opts - `dir` overrides the root (default `".mithril/tools"`).
 * @returns a scoped tool store.
 *
 * @remarks
 * Laid out as `<dir>/<scope>/<name>.json`, so the toolbox is reviewable with ordinary tools. No index is
 * needed — `FileSystem` can enumerate. Path traversal is doubly prevented: `FileSystem` is rooted and
 * throws on an escaping path, and an authored tool's name cannot contain a separator in the first place.
 */
export function fsToolStore(fs: FileSystem, opts: { readonly dir?: string } = {}): ToolStore {
  const root = opts.dir ?? ".mithril/tools";
  const dirOf = (scope: string): string => `${root}/${scope}`;
  const fileOf = (scope: string, name: string): string => `${dirOf(scope)}/${name}.json`;
  return {
    async load(scope) {
      const dir = dirOf(scope);
      if (!(await fs.exists(dir))) return [];
      const out: ToolDefinition[] = [];
      for await (const entry of fs.list(dir)) {
        if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;
        try {
          const parsed: unknown = JSON.parse(await fs.readText(`${dir}/${entry.name}`));
          if (isDefinition(parsed)) out.push(parsed);
        } catch {
          // Unreadable or corrupt: skip. A stale cache must never fail a run.
        }
      }
      return out;
    },
    async save(scope, def) {
      await fs.mkdir(dirOf(scope));
      await fs.writeFile(fileOf(scope, def.name), JSON.stringify(def, null, 2));
    },
    async remove(scope, name) {
      const path = fileOf(scope, name);
      if (await fs.exists(path)) await fs.remove(path);
    },
  };
}

/** Bridges {@link toolStoreConformance} to a host test runner. */
export interface ToolStoreTestAdapter {
  test(name: string, fn: () => void | Promise<void>): void;
  assertEqual(actual: unknown, expected: unknown): void;
}

/**
 * The shared conformance suite every {@link ToolStore} implementation must pass.
 *
 * @param make - factory producing a fresh, empty store per case.
 * @param t - adapter bridging to the host test runner.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { memoryKv } from "@mithril/kv";
 * import { kvToolStore, toolStoreConformance } from "@mithril/authoring/persistence";
 *
 * toolStoreConformance(async () => kvToolStore(memoryKv()), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
 * ```
 */
export function toolStoreConformance(make: () => Promise<ToolStore>, t: ToolStoreTestAdapter): void {
  const def = (name: string, digest = "d1"): ToolDefinition => ({
    name,
    description: `the ${name} tool`,
    inputSchema: { type: "object" },
    body: { kind: "composition", steps: [] },
    digest,
  });

  t.test("an empty scope loads as an empty list", async () => {
    const s = await make();
    t.assertEqual(await s.load("default"), []);
  });

  t.test("save then load round-trips a definition", async () => {
    const s = await make();
    await s.save("default", def("alpha"));
    t.assertEqual(await s.load("default"), [def("alpha")]);
  });

  t.test("saving the same name twice replaces rather than duplicates", async () => {
    const s = await make();
    await s.save("default", def("alpha", "d1"));
    await s.save("default", def("alpha", "d2"));
    t.assertEqual(await s.load("default"), [def("alpha", "d2")]);
  });

  t.test("remove deletes a definition, and removing an absent one is a no-op", async () => {
    const s = await make();
    await s.save("default", def("alpha"));
    await s.save("default", def("beta"));
    await s.remove("default", "alpha");
    await s.remove("default", "never-existed");
    t.assertEqual(await s.load("default"), [def("beta")]);
  });

  t.test("scopes are isolated", async () => {
    const s = await make();
    await s.save("team-a", def("alpha"));
    await s.save("team-b", def("beta"));
    t.assertEqual(await s.load("team-a"), [def("alpha")]);
    t.assertEqual(await s.load("team-b"), [def("beta")]);
  });

  t.test("a removed name can be saved again", async () => {
    const s = await make();
    await s.save("default", def("alpha"));
    await s.remove("default", "alpha");
    await s.save("default", def("alpha", "d3"));
    t.assertEqual(await s.load("default"), [def("alpha", "d3")]);
  });
}
