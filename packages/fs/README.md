# @mithril/fs

A runtime-agnostic `FileSystem` for tools. Write a file-touching tool once; it runs on a server (Node/Bun)
or in a browser (OPFS) by swapping the adapter at the app's edge. Async-only, path-based, and **rooted** —
a path can never escape its base.

```ts
import { nodeFileSystem } from "@mithril/fs/node"; // server
// import { opfsFileSystem } from "@mithril/fs/opfs"; // browser
// import { memoryFileSystem } from "@mithril/fs"; // tests / ephemeral

const fs = nodeFileSystem("./workspace"); // confined to ./workspace
await fs.writeFile("notes/todo.md", "- ship it");
await fs.readText("notes/todo.md"); // → "- ship it"
await fs.readText("../../../etc/passwd"); // throws FsError — escapes root
```

The tool never changes — only the wiring does:

```ts
const readDoc = tool({
  name: "readDoc", description: "…", inputSchema: z.object({ path: z.string() }),
  execute: ({ path }, ctx) => ctx.deps.fs.readText(path), // byte-identical on server + browser
});
```

## Backends

| Import | Runtime |
|---|---|
| `@mithril/fs` → `memoryFileSystem()` | any |
| `@mithril/fs/node` → `nodeFileSystem(root)` | Node / Bun (root-confined) |
| `@mithril/fs/opfs` → `opfsFileSystem()` | browser (Origin Private File System) |

## API

`readText` · `readFile` (`Uint8Array`) · `writeFile` · `list` (async-iterable of `{ name, kind }`) · `stat`
· `exists` · `mkdir` · `remove`. Every backend passes `fileSystemConformance(make, t)`.

The interface promises the **cross-runtime intersection**, not Node's superset — no symlinks, no sync, minimal `stat`.
