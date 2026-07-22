import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { createApp, isTemplate, scaffold } from "../src/index.ts";

test("scaffold produces a runnable app shape", () => {
  const files = scaffold("node-cli", "demo");
  expect(Object.keys(files).sort()).toEqual(["README.md", "package.json", "src/agent.ts", "src/main.ts"]);
  expect(files["src/agent.ts"]).toContain('from "mithril"');
  // The generated main must compile — status-checked, not the non-existent `const { output } =`.
  expect(files["src/main.ts"]).not.toContain("const { output }");
});

test("bun-server template actually serves over HTTP", () => {
  const files = scaffold("bun-server", "demo");
  expect(files["src/main.ts"]).toContain("Bun.serve");
  expect(files["src/main.ts"]).toContain("assistant.stream");
});

test("react-chat template ships its React deps and wires useRun", () => {
  const files = scaffold("react-chat", "demo");
  expect(Object.keys(files)).toContain("src/Chat.tsx");
  expect(files["src/Chat.tsx"]).toContain("useRun");
  const pkg = JSON.parse(files["package.json"]!) as { dependencies: Record<string, string> };
  expect(pkg.dependencies["react"]).toBeDefined();
  expect(pkg.dependencies["@mithril/react"]).toBeDefined();
});

test("scaffold pins zod v4 (matches the converter/quickstart)", () => {
  const pkg = JSON.parse(scaffold("node-cli", "demo")["package.json"]!) as { dependencies: Record<string, string> };
  expect(pkg.dependencies["zod"]).toBe("^4");
});

test("isTemplate validates the CLI argument", () => {
  expect(isTemplate("node-cli")).toBe(true);
  expect(isTemplate("typo")).toBe(false);
});

test("createApp writes the files to disk", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mithril-scaffold-"));
  const written = await createApp("node-cli", "demo", dir);
  expect(written).toContain("src/agent.ts");
  const agent = await readFile(join(dir, "src/agent.ts"), "utf8");
  expect(agent).toContain("openai(");
});
