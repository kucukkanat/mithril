import { type FileSystem, FsError } from "./index.ts";

// Browser FileSystem over the Origin Private File System (navigator.storage). Inherently rooted at the
// origin's private tree. Verify in a browser; this file type-checks against the DOM lib.

/**
 * Create a {@link FileSystem} backed by the browser's Origin Private File System.
 *
 * @remarks
 * **Browser-only** — requires `navigator.storage.getDirectory()` (OPFS). Storage is inherently
 * rooted at the origin's private tree and persists across sessions per origin; a path that escapes
 * the root throws an {@link FsError}. Not visible to the user's regular file explorer.
 *
 * @returns A rooted filesystem over the origin's private storage.
 * @throws {@link FsError} on a path that escapes the root, and (from reads/stat) when an entry is missing.
 */

interface DirEntries {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

function segments(p: string): string[] {
  const out: string[] = [];
  for (const s of p.split("/")) {
    if (s === "" || s === ".") continue;
    if (s === "..") {
      if (out.length === 0) throw new FsError(`path escapes root: ${p}`);
      out.pop();
      continue;
    }
    out.push(s);
  }
  return out;
}

async function dirHandle(segs: readonly string[], create: boolean): Promise<FileSystemDirectoryHandle> {
  let d = await navigator.storage.getDirectory();
  for (const s of segs) d = await d.getDirectoryHandle(s, { create });
  return d;
}
async function fileHandle(path: string, create: boolean): Promise<FileSystemFileHandle> {
  const segs = segments(path);
  const name = segs.pop();
  if (name === undefined) throw new FsError("empty path");
  return (await dirHandle(segs, create)).getFileHandle(name, { create });
}

export function opfsFileSystem(): FileSystem {
  return {
    async readFile(path) {
      return new Uint8Array(await (await (await fileHandle(path, false)).getFile()).arrayBuffer());
    },
    async readText(path) {
      return (await (await fileHandle(path, false)).getFile()).text();
    },
    async writeFile(path, data) {
      const w = await (await fileHandle(path, true)).createWritable();
      await w.write(typeof data === "string" ? data : new Uint8Array(data)); // fresh ArrayBuffer-backed copy
      await w.close();
    },
    async *list(dir) {
      const d = (await dirHandle(segments(dir), false)) as unknown as DirEntries;
      for await (const [name, handle] of d.entries()) yield { name, kind: handle.kind === "directory" ? "directory" : "file" };
    },
    async stat(path) {
      try {
        const f = await (await fileHandle(path, false)).getFile();
        return { size: f.size, lastModified: f.lastModified, kind: "file" };
      } catch {
        await dirHandle(segments(path), false);
        return { size: 0, lastModified: 0, kind: "directory" };
      }
    },
    async exists(path) {
      try {
        await fileHandle(path, false);
        return true;
      } catch {
        try {
          await dirHandle(segments(path), false);
          return true;
        } catch {
          return false;
        }
      }
    },
    async mkdir(path) {
      await dirHandle(segments(path), true);
    },
    async remove(path) {
      const segs = segments(path);
      const name = segs.pop();
      if (name === undefined) return;
      await (await dirHandle(segs, false)).removeEntry(name, { recursive: true });
    },
  };
}
