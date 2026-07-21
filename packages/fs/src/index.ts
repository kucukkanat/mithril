/**
 * Runtime-agnostic, async, path-based filesystem for tools — with a confinement guarantee.
 *
 * @remarks
 * Every {@link FileSystem} is **rooted**: paths are relative to a base, and any path that
 * escapes it (via `..`) throws an {@link FsError}. All operations are async; there is no
 * synchronous or streaming API yet.
 *
 * Pick an implementation by runtime: {@link memoryFileSystem} (everywhere; ephemeral),
 * `nodeFileSystem` from `@mithril/fs/node` (server-only), or `opfsFileSystem` from
 * `@mithril/fs/opfs` (browser-only). All satisfy the same {@link FileSystem} interface and
 * pass the shared {@link fileSystemConformance} suite.
 *
 * @packageDocumentation
 */

// §10.1 — runtime-agnostic FileSystem for tools. Async-only, path-based, ROOTED (paths can't escape).
// The in-memory impl works everywhere (tests/ephemeral); node/bun/opfs adapters follow the same interface
// behind explicit per-runtime subpaths. Streaming (readable/writable) is a follow-up.

/** Whether a filesystem entry is a regular file or a directory. */
export type FileKind = "file" | "directory";

/**
 * The rooted, async filesystem contract shared by every `@mithril/fs` adapter.
 *
 * @remarks
 * Paths are relative to the adapter's root; a path that escapes it throws an {@link FsError}.
 * Missing entries also throw {@link FsError} (with an `ENOENT`-style message for the in-memory adapter).
 */
export interface FileSystem {
  /** Read a file's contents as a UTF-8 decoded string. @throws {@link FsError} if the path is missing or escapes the root. */
  readText(path: string): Promise<string>;
  /** Read a file's raw bytes. @throws {@link FsError} if the path is missing or escapes the root. */
  readFile(path: string): Promise<Uint8Array>;
  /** Write bytes or a string to `path`, creating parent directories as needed. Strings are UTF-8 encoded. */
  writeFile(path: string, data: Uint8Array | string): Promise<void>;
  /** Asynchronously yield the immediate children of `dir` (not recursive), each with its {@link FileKind}. */
  list(dir: string): AsyncIterable<{ readonly name: string; readonly kind: FileKind }>;
  /** Return `size` (bytes), `lastModified` (epoch ms), and {@link FileKind} for `path`. @throws {@link FsError} if missing. */
  stat(path: string): Promise<{ readonly size: number; readonly lastModified: number; readonly kind: FileKind }>;
  /** Resolve `true` if a file or directory exists at `path`, `false` otherwise. */
  exists(path: string): Promise<boolean>;
  /** Create the directory at `path` (recursive). No-op for the in-memory adapter, where directories are implicit. */
  mkdir(path: string): Promise<void>;
  /** Remove `path` recursively; removing a missing path is not an error. */
  remove(path: string): Promise<void>;
}

/** Error thrown by every {@link FileSystem} adapter — e.g. a missing entry or a path that escapes the root. */
export class FsError extends Error {}

// Normalize to a canonical rooted path; `..` that escapes the root is rejected (the confinement guarantee).
function norm(p: string): string {
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (parts.length === 0) throw new FsError(`path escapes root: ${p}`);
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join("/");
}

/**
 * Create an in-memory {@link FileSystem} — works in any runtime, holds nothing on disk.
 *
 * @remarks
 * Directories are implicit: they exist as long as a file lives under them, so {@link FileSystem.mkdir}
 * is a no-op. Ideal for tests and ephemeral scratch space.
 *
 * @param now - Clock used for `lastModified` timestamps; defaults to `Date.now`. Injectable for deterministic tests.
 * @returns A fresh, empty rooted filesystem backed by a `Map`.
 * @example
 * ```ts
 * const fs = memoryFileSystem();
 * await fs.writeFile("notes/todo.txt", "buy milk");
 * await fs.readText("notes/todo.txt"); // "buy milk"
 * for await (const e of fs.list("notes")) console.log(e.name, e.kind); // "todo.txt" "file"
 * ```
 */
export function memoryFileSystem(now: () => number = Date.now): FileSystem {
  const files = new Map<string, { bytes: Uint8Array; mtime: number }>();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const hasChildren = (dir: string): boolean => {
    for (const k of files.keys()) if (k.startsWith(`${dir}/`)) return true;
    return false;
  };
  return {
    async readFile(path) {
      const f = files.get(norm(path));
      if (f === undefined) throw new FsError(`ENOENT: ${path}`);
      return f.bytes;
    },
    async readText(path) {
      const f = files.get(norm(path));
      if (f === undefined) throw new FsError(`ENOENT: ${path}`);
      return decoder.decode(f.bytes);
    },
    async writeFile(path, data) {
      const bytes = typeof data === "string" ? encoder.encode(data) : data;
      files.set(norm(path), { bytes, mtime: now() });
    },
    async *list(dir) {
      const prefix = norm(dir);
      const seen = new Set<string>();
      for (const key of files.keys()) {
        let rel: string | undefined;
        if (prefix === "") rel = key;
        else if (key.startsWith(`${prefix}/`)) rel = key.slice(prefix.length + 1);
        if (rel === undefined || rel === "") continue;
        const name = rel.split("/")[0];
        if (name === undefined || seen.has(name)) continue;
        seen.add(name);
        yield { name, kind: rel.includes("/") ? "directory" : "file" };
      }
    },
    async stat(path) {
      const n = norm(path);
      const f = files.get(n);
      if (f !== undefined) return { size: f.bytes.byteLength, lastModified: f.mtime, kind: "file" };
      if (hasChildren(n)) return { size: 0, lastModified: 0, kind: "directory" };
      throw new FsError(`ENOENT: ${path}`);
    },
    async exists(path) {
      const n = norm(path);
      return files.has(n) || hasChildren(n);
    },
    async mkdir() {
      // directories are implicit in the in-memory store
    },
    async remove(path) {
      const n = norm(path);
      files.delete(n);
      for (const k of [...files.keys()]) if (k.startsWith(`${n}/`)) files.delete(k);
    },
  };
}

/**
 * Test-runner adapter that lets {@link fileSystemConformance} run under any framework.
 *
 * @remarks
 * Implement this by delegating to your runner (e.g. Bun's `test` / `expect`) so the shared
 * suite stays framework-agnostic.
 */
export interface FsTestAdapter {
  /** Register a named test case. */
  test(name: string, fn: () => void | Promise<void>): void;
  /** Assert deep equality of `actual` and `expected`. */
  assertEqual(actual: unknown, expected: unknown): void;
  /** Assert that awaiting `fn` rejects. */
  assertThrowsAsync(fn: () => Promise<unknown>): Promise<void>;
}

/**
 * Run the shared behavioral conformance suite against any {@link FileSystem} implementation.
 *
 * @remarks
 * Covers write/read round-trips, immediate-children listing, recursive removal, and rejection of
 * path traversal that escapes the root. Use it to validate custom adapters.
 *
 * @param make - Factory that produces a fresh, empty filesystem for each test.
 * @param t - {@link FsTestAdapter} bridging the suite to your test runner.
 */
export function fileSystemConformance(make: () => Promise<FileSystem>, t: FsTestAdapter): void {
  t.test("write → read text", async () => {
    const fs = await make();
    await fs.writeFile("a/b.txt", "hello");
    t.assertEqual(await fs.readText("a/b.txt"), "hello");
    t.assertEqual(await fs.exists("a/b.txt"), true);
    t.assertEqual((await fs.stat("a/b.txt")).size, 5);
  });
  t.test("list yields immediate children", async () => {
    const fs = await make();
    await fs.writeFile("d/f1.txt", "1");
    await fs.writeFile("d/sub/f2.txt", "2");
    const entries: string[] = [];
    for await (const e of fs.list("d")) entries.push(`${e.name}:${e.kind}`);
    t.assertEqual(entries.sort(), ["f1.txt:file", "sub:directory"]);
  });
  t.test("remove deletes recursively", async () => {
    const fs = await make();
    await fs.writeFile("x/a.txt", "1");
    await fs.writeFile("x/y/b.txt", "2");
    await fs.remove("x");
    t.assertEqual(await fs.exists("x"), false);
  });
  t.test("path traversal that escapes root is rejected", async () => {
    const fs = await make();
    await t.assertThrowsAsync(() => fs.readText("../etc/passwd"));
  });
}
