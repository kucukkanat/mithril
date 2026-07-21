import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { type FileSystem, FsError } from "./index.ts";

/**
 * Create a {@link FileSystem} backed by the local disk, confined to `root`.
 *
 * @remarks
 * **Server-only** — requires `node:fs/promises`; runs on Node 18+ and Bun. Any path that resolves
 * outside `root` is rejected with an {@link FsError}, giving the same confinement guarantee as the
 * in-memory and OPFS adapters. Writes create parent directories automatically.
 *
 * @param root - Base directory all paths are resolved against; created lazily on first write.
 * @returns A rooted filesystem over `root`.
 * @throws {@link FsError} on any operation whose path escapes `root`.
 * @example
 * ```ts
 * import { nodeFileSystem } from "@mithril/fs/node";
 *
 * const fs = nodeFileSystem("./workspace");
 * await fs.writeFile("out/result.json", JSON.stringify({ ok: true }));
 * const text = await fs.readText("out/result.json");
 * ```
 */
export function nodeFileSystem(root: string): FileSystem {
  const rootAbs = resolve(root);
  const full = (p: string): string => {
    const abs = resolve(rootAbs, p);
    const rel = relative(rootAbs, abs);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new FsError(`path escapes root: ${p}`);
    return abs;
  };
  return {
    async readFile(path) {
      return new Uint8Array(await readFile(full(path)));
    },
    async readText(path) {
      return readFile(full(path), "utf8");
    },
    async writeFile(path, data) {
      const f = full(path);
      await mkdir(dirname(f), { recursive: true });
      await writeFile(f, data);
    },
    async *list(dir) {
      const entries = await readdir(full(dir), { withFileTypes: true });
      for (const e of entries) yield { name: e.name, kind: e.isDirectory() ? "directory" : "file" };
    },
    async stat(path) {
      const s = await stat(full(path));
      return { size: s.size, lastModified: s.mtimeMs, kind: s.isDirectory() ? "directory" : "file" };
    },
    async exists(path) {
      try {
        await access(full(path));
        return true;
      } catch {
        return false;
      }
    },
    async mkdir(path) {
      await mkdir(full(path), { recursive: true });
    },
    async remove(path) {
      await rm(full(path), { recursive: true, force: true });
    },
  };
}
