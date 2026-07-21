import { expect, test } from "bun:test";
import { fileSystemConformance, memoryFileSystem } from "../src/index.ts";

fileSystemConformance(async () => memoryFileSystem(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b as never),
  assertThrowsAsync: async (fn) => {
    await expect(fn()).rejects.toBeDefined();
  },
});

test("binary round-trips through readFile/writeFile", async () => {
  const fs = memoryFileSystem();
  const bytes = new Uint8Array([1, 2, 3, 255]);
  await fs.writeFile("bin", bytes);
  expect([...(await fs.readFile("bin"))]).toEqual([1, 2, 3, 255]);
});
