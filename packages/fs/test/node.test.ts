import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { fileSystemConformance } from "../src/index.ts";
import { nodeFileSystem } from "../src/node.ts";

// The SAME conformance suite that memoryFileSystem passes, now against the REAL filesystem (fresh temp dir
// per case) — proof the adapter honors identical semantics, confinement included.
fileSystemConformance(async () => nodeFileSystem(await mkdtemp(join(tmpdir(), "mithril-fs-"))), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b as never),
  assertThrowsAsync: async (fn) => {
    await expect(fn()).rejects.toBeDefined();
  },
});

test("nodeFileSystem persists to a real directory and confines to root", async () => {
  const root = await mkdtemp(join(tmpdir(), "mithril-fs-"));
  const fs = nodeFileSystem(root);
  await fs.writeFile("notes/a.txt", "hello");
  expect(await fs.readText("notes/a.txt")).toBe("hello");
  await expect(fs.readText("../../../etc/hosts")).rejects.toBeDefined(); // escape rejected
});

test("nodeFileSystem accepts an options object { root }", async () => {
  const root = await mkdtemp(join(tmpdir(), "mithril-fs-opts-"));
  const fs = nodeFileSystem({ root });
  await fs.writeFile("a.txt", "hi");
  expect(await fs.readText("a.txt")).toBe("hi");
});
