import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

// node:sqlite is a Node built-in absent under Bun (this runner). We verify the Node backend where it actually
// runs: spawn `node --experimental-strip-types` on the fixture. Skips cleanly when Node/node:sqlite is absent.
async function nodeWithSqlite(): Promise<boolean> {
  try {
    const probe = Bun.spawn(["node", "-e", "require('node:sqlite')"], { stdout: "ignore", stderr: "ignore" });
    return (await probe.exited) === 0;
  } catch {
    return false;
  }
}

test.skipIf(!(await nodeWithSqlite()))("node:sqlite backend passes verification under real Node", async () => {
  const fixture = fileURLToPath(new URL("./fixtures/verify-sqlite-node.mts", import.meta.url));
  const proc = Bun.spawn(["node", "--experimental-strip-types", fixture], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  expect(code, `node exited ${code}: ${err}`).toBe(0);
  expect(out).toContain("PASS");
});
