/*
 * What a generated tool body is allowed to reach for, and how it gets there.
 *
 * The gap this closes: every one of these packages is ALREADY in the runner's module registry
 * (`@mithril/runner-web`'s `defaultModules`), so a snippet can use them today — but the creator had
 * no way to say so. `create_tool` carries only a body, and codegen's `plannedImports` is a closed
 * set (`mithril`, a provider, `@mithril/workflows`, `zod`), so a body referencing `opfsFileSystem`
 * generated a file with an unbound identifier. Asking the model to write a memory system was asking
 * for code that could not have run.
 *
 * The whole feature lives in the Studio. A capability becomes two `opaque` decls — the import and
 * the `const` — which codegen already emits verbatim and `parseProject` already round-trips, so
 * `packages/spec` is untouched: no new decl kind, no ToolSpec field, no specVersion bump, no
 * migration. `orderDecls` lifts the setup above the tools that use it for free, because its BINDER
 * regex already reads top-level `const` out of opaque code.
 *
 * The menu is a WHITELIST, never a free-form import string: a model-supplied specifier would be a
 * way to pull arbitrary modules into the worker, and "the model asked for it" is not a permission
 * check.
 */

/** One thing a tool body can be given: a module, the factory it calls, and how to describe both. */
export interface Capability {
  /** The id the model names in `use_storage`. */
  readonly id: string;
  /** Import specifier — must be a key of the runner's module registry. */
  readonly module: string;
  /** The named export the setup line calls. */
  readonly factory: string;
  /** Does data survive a reload? Stated to the model, because it changes which one is right. */
  readonly persistent: boolean;
  /** One line: what it is and when to pick it. */
  readonly summary: string;
  /** The exact methods a body may call, as documentation. Verified against the package source. */
  readonly api: readonly string[];
}

/**
 * The capabilities the creator may hand to a tool.
 *
 * Persistent-first, because the prompts that need storage at all ("remember this", "take notes")
 * are asking for something that outlives the run. The in-memory pair is kept for the case where a
 * body genuinely wants scratch state, and because naming it explicitly stops the model reaching for
 * a module-level `Map` it cannot declare.
 *
 * Deliberately absent: `@mithril/vectors`, which needs an embedding model the creator has no way to
 * wire up, and would look like semantic recall while silently being none.
 */
export const CAPABILITIES: readonly Capability[] = [
  {
    id: "files",
    module: "@mithril/fs/opfs",
    factory: "opfsFileSystem",
    persistent: true,
    summary: "Real files in the browser's origin-private filesystem. Survives reloads. Best for notes, documents, anything you want to read back whole.",
    api: [
      "await store.writeFile(path, text) — creates parent directories as needed",
      "await store.readText(path) — THROWS if the path is missing, so check exists() first",
      "await store.exists(path) → boolean",
      "for await (const entry of store.list(dir)) — entry is { name, kind: 'file' | 'directory' }, immediate children only",
      "await store.stat(path) → { size, lastModified, kind }",
      "await store.remove(path) — recursive; removing something missing is not an error",
    ],
  },
  {
    id: "kv",
    module: "@mithril/kv/indexeddb",
    factory: "indexedDbKv",
    persistent: true,
    summary: "A persistent key → JSON store. Survives reloads. Best for facts, preferences, anything you look up by a known key.",
    api: [
      "await store.set(key, value) — value is any JSON-serializable value; pass { ttlMs } to expire it",
      "await store.get(key) → the value, or undefined if absent or expired",
      "await store.has(key) → boolean",
      "await store.delete(key)",
      "THERE IS NO list/keys METHOD. To enumerate later, also keep an index: read the array at a key like 'index', push the new key, write it back.",
    ],
  },
  {
    id: "files_memory",
    module: "@mithril/fs",
    factory: "memoryFileSystem",
    persistent: false,
    summary: "The same file API, held in memory only — everything is lost when the run ends. Pick this only for scratch space.",
    api: ["Identical to `files`."],
  },
  {
    id: "kv_memory",
    module: "@mithril/kv",
    factory: "memoryKv",
    persistent: false,
    summary: "The same key-value API, held in memory only — everything is lost when the run ends. Pick this only for scratch space.",
    api: ["Identical to `kv`."],
  },
];

/** Look up a capability by the id the model used. */
export function capabilityOf(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}

/** The two statements that put `binding` in scope: the import, then the setup const. */
export function capabilitySetup(cap: Capability, binding: string): readonly [importLine: string, constLine: string] {
  return [`import { ${cap.factory} } from ${JSON.stringify(cap.module)};`, `const ${binding} = ${cap.factory}();`];
}

/**
 * The capability menu as prompt text.
 *
 * Generated from {@link CAPABILITIES} rather than written out, so a capability can never be offered
 * to the model without the host also knowing how to emit it — the exact drift that produced tool
 * bodies referencing storage the file never imported.
 */
export function capabilityCatalogue(): string {
  return CAPABILITIES.map((c) =>
    [`- ${c.id}${c.persistent ? " (persists across runs)" : " (in-memory, lost when the run ends)"}: ${c.summary}`, ...c.api.map((a) => `    ${a}`)].join(
      "\n",
    ),
  ).join("\n");
}
