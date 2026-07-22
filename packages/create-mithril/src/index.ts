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

/** The available starter templates: a streaming CLI, a streaming HTTP server, or a React chat component. */
export type Template = "node-cli" | "bun-server" | "react-chat";

/** The templates, as a runtime-checkable list (used to validate the CLI argument). */
export const TEMPLATES: readonly Template[] = ["node-cli", "bun-server", "react-chat"];

/** Type guard: is `s` one of the known {@link Template}s? */
export function isTemplate(s: string): s is Template {
  return (TEMPLATES as readonly string[]).includes(s);
}

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

// A streaming CLI: prints the answer token-by-token, then reports a non-completed status.
const NODE_CLI_MAIN = `import { assistant } from "./agent.ts";

const input = process.argv.slice(2).join(" ") || "Weather in Istanbul?";
const handle = assistant.stream(input);
for await (const delta of handle.text) process.stdout.write(delta);
process.stdout.write("\\n");
const result = await handle.result();
if (result.status !== "completed") console.error(\`Run ended: \${result.status}\`);
`;

// A real HTTP server that streams a run's text over the wire — the "serve an agent" starting point.
const BUN_SERVER_MAIN = `import { assistant } from "./agent.ts";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  fetch(req) {
    const input = new URL(req.url).searchParams.get("q") ?? "Weather in Istanbul?";
    const handle = assistant.stream(input);
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enc = new TextEncoder();
        for await (const delta of handle.text) controller.enqueue(enc.encode(delta));
        controller.close();
      },
    });
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
});
console.log(\`Listening on http://localhost:\${server.port} — try /?q=Weather+in+Paris\`);
`;

// A headless React chat component wired to useRun. Bring your own bundler (e.g. Vite) to render it.
const REACT_CHAT_TSX = `import { useState } from "react";
import { useRun, type RunSource } from "@mithril/react/hooks";
import { assistant } from "./agent.ts";

export function Chat() {
  const [handle, setHandle] = useState<RunSource | undefined>(undefined);
  const run = useRun(handle); // undefined until the first run → an empty idle snapshot

  return (
    <div>
      <button onClick={() => setHandle(assistant.stream("Weather in Istanbul?"))}>Ask</button>
      <pre>{run.text}</pre>
      <small>{run.status}</small>
    </div>
  );
}
`;

interface TemplatePlan {
  readonly entry: readonly [path: string, contents: string];
  readonly extraDeps: Readonly<Record<string, string>>;
  readonly runHint: string;
}

function planFor(template: Template): TemplatePlan {
  switch (template) {
    case "node-cli":
      return { entry: ["src/main.ts", NODE_CLI_MAIN], extraDeps: {}, runHint: "OPENAI_API_KEY=… bun run start" };
    case "bun-server":
      return { entry: ["src/main.ts", BUN_SERVER_MAIN], extraDeps: {}, runHint: "OPENAI_API_KEY=… bun run start  # then open http://localhost:3000/?q=Weather+in+Paris" };
    case "react-chat":
      return {
        entry: ["src/Chat.tsx", REACT_CHAT_TSX],
        extraDeps: { react: "^19", "react-dom": "^19", "@mithril/react": "^0" },
        runHint: "render <Chat /> with your bundler of choice (e.g. Vite); set OPENAI_API_KEY for live runs",
      };
  }
}

/**
 * Generate the files for a Mithril app as an in-memory map — pure, no disk I/O.
 *
 * @remarks
 * Always emits `package.json`, `src/agent.ts`, and `README.md`, plus a template-specific entry: a streaming
 * `src/main.ts` CLI (`node-cli`), a streaming `Bun.serve` HTTP server in `src/main.ts` (`bun-server`), or a
 * `useRun`-wired `src/Chat.tsx` component (`react-chat`, whose `package.json` includes the React deps).
 * Being side-effect-free, it is trivially testable; use {@link createApp} to write the result.
 *
 * @param template - Which starter to generate.
 * @param appName - Used as the package `name` and in the generated README.
 * @returns A map of relative file path to file contents.
 * @example
 * ```ts
 * const files = scaffold("bun-server", "my-agent");
 * Object.keys(files); // ["package.json", "src/agent.ts", "README.md", "src/main.ts"]
 * ```
 */
export function scaffold(template: Template, appName: string): Readonly<Record<string, string>> {
  const plan = planFor(template);
  const [entryPath, entryContents] = plan.entry;
  const isServerLike = template === "node-cli" || template === "bun-server";
  const pkg = JSON.stringify(
    {
      name: appName,
      private: true,
      type: "module",
      ...(isServerLike ? { scripts: { start: "bun run src/main.ts" } } : {}),
      dependencies: { mithril: "^0", zod: "^4", ...plan.extraDeps },
    },
    null,
    2,
  );
  return {
    "package.json": `${pkg}\n`,
    "src/agent.ts": AGENT_TS,
    [entryPath]: entryContents,
    "README.md": `# ${appName}\n\nRun: \`${plan.runHint}\`\n`,
  };
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
