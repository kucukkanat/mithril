import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { createApp, scaffold } from "../src/index.ts";

test("scaffold produces a runnable app shape", () => {
  const files = scaffold("node-cli", "demo");
  expect(Object.keys(files).sort()).toEqual(["README.md", "package.json", "src/agent.ts", "src/main.ts"]);
  expect(files["src/agent.ts"]).toContain('from "mithril"');
});

test("createApp writes the files to disk", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mithril-scaffold-"));
  const written = await createApp("node-cli", "demo", dir);
  expect(written).toContain("src/agent.ts");
  const agent = await readFile(join(dir, "src/agent.ts"), "utf8");
  expect(agent).toContain("openai(");
});
