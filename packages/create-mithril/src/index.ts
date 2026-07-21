/**
 * Scaffold a runnable Mithril app from a template.
 *
 * @remarks
 * {@link scaffold} is the pure core — it returns a `{ path: contents }` map with no I/O — and
 * {@link createApp} writes that map to disk. Server-only (`node:fs/promises`).
 *
 * @packageDocumentation
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// Scaffolds a runnable Mithril app in <10 lines of user-facing code — the strongest DX statement is the
// first-run experience. Templates return a { path: contents } map so the generator is pure and testable.

/** The available starter templates. `node-cli` and `bun-server` produce a CLI entry; `react-chat` exports the agent for a UI. */
export type Template = "node-cli" | "bun-server" | "react-chat";

const AGENT_TS = `import { agent, tool } from "mithril";
import { openai } from "mithril/openai";
import { z } from "zod";

const weather = tool({
  name: "weather",
  description: "Get the weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 21 }),
});

export const assistant = agent({
  model: openai("gpt-4o"),
  instructions: "You are a concise assistant. Use tools when useful.",
  tools: [weather],
});
`;

/**
 * Generate the files for a Mithril app as an in-memory map — pure, no disk I/O.
 *
 * @remarks
 * Always emits `package.json`, `src/agent.ts`, `README.md`, and a `src/main.ts` whose contents depend
 * on `template`. Being side-effect-free, it is trivially testable; use {@link createApp} to write the result.
 *
 * @param template - Which starter to generate.
 * @param appName - Used as the package `name` and in the generated README.
 * @returns A map of relative file path to file contents.
 * @example
 * ```ts
 * const files = scaffold("node-cli", "my-agent");
 * Object.keys(files); // ["package.json", "src/agent.ts", "README.md", "src/main.ts"]
 * ```
 */
export function scaffold(template: Template, appName: string): Readonly<Record<string, string>> {
  const pkg = JSON.stringify(
    {
      name: appName,
      private: true,
      type: "module",
      scripts: { start: "bun run src/main.ts" },
      dependencies: { mithril: "^0", zod: "^3" },
    },
    null,
    2,
  );
  const files: Record<string, string> = {
    "package.json": `${pkg}\n`,
    "src/agent.ts": AGENT_TS,
    "README.md": `# ${appName}\n\nRun: \`OPENAI_API_KEY=… bun run start\`\n`,
  };
  if (template === "node-cli" || template === "bun-server") {
    files["src/main.ts"] = `import { assistant } from "./agent.ts";

const { output } = await assistant.run(process.argv.slice(2).join(" ") || "Weather in Istanbul?");
console.log(output);
`;
  } else {
    files["src/main.ts"] = `import { assistant } from "./agent.ts";
// Wire assistant.stream(...) into useRun from "@mithril/react/hooks" in your component.
export { assistant };
`;
  }
  return files;
}

/**
 * Write a scaffolded template to disk under `dir`, creating parent directories as needed.
 *
 * @remarks
 * Server-only (`node:fs/promises`). Thin I/O wrapper around {@link scaffold}.
 *
 * @param template - Which starter to generate.
 * @param appName - Package name embedded in the generated files.
 * @param dir - Target directory the files are written under.
 * @returns The relative paths written, in generation order.
 */
export async function createApp(template: Template, appName: string, dir: string): Promise<readonly string[]> {
  const files = scaffold(template, appName);
  const written: string[] = [];
  for (const [rel, contents] of Object.entries(files)) {
    const path = join(dir, rel);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
    written.push(rel);
  }
  return written;
}
