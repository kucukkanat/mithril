// @ts-check
/*
 * The ordered Vite alias list mapping every `@mithril/*` (and `mithril[/subpath]`) specifier to its
 * raw workspace source `.ts`. The packages are source-as-published (zero-build), so bundlers consume
 * the exact code that ships to npm. Shared by apps/docs (astro.config.mjs) and apps/studio
 * (vite.config.ts) so the two lists can never drift.
 *
 * Order matters: more specific ids must come first (e.g. `@mithril/core/protocol` before any
 * `@mithril/core` fallback, `mithril/openai` before `mithril`) — Vite matches top-down.
 */
import { fileURLToPath } from "node:url";

/** @param {string} p path under `packages/` */
const pkg = (p) => fileURLToPath(new URL(`../packages/${p}`, import.meta.url));

/** @returns {{ find: string, replacement: string }[]} */
export function mithrilAliases() {
  return [
    { find: "@mithril/core/protocol", replacement: pkg("core/src/protocol/index.ts") },
    { find: "@mithril/core/agent", replacement: pkg("core/src/agent/index.ts") },
    { find: "@mithril/core/testkit", replacement: pkg("core/src/testkit/index.ts") },
    { find: "@mithril/providers/openai", replacement: pkg("providers/src/openai/index.ts") },
    { find: "@mithril/providers/anthropic", replacement: pkg("providers/src/anthropic/index.ts") },
    { find: "@mithril/providers/google", replacement: pkg("providers/src/google/index.ts") },
    { find: "@mithril/providers/transformers", replacement: pkg("providers/src/transformers/index.ts") },
    { find: "@mithril/memory/indexeddb", replacement: pkg("memory/src/indexeddb.ts") },
    { find: "@mithril/memory", replacement: pkg("memory/src/index.ts") },
    { find: "@mithril/kv/indexeddb", replacement: pkg("kv/src/indexeddb.ts") },
    { find: "@mithril/kv", replacement: pkg("kv/src/index.ts") },
    { find: "@mithril/fs/opfs", replacement: pkg("fs/src/opfs.ts") },
    { find: "@mithril/fs", replacement: pkg("fs/src/index.ts") },
    { find: "@mithril/vectors", replacement: pkg("vectors/src/index.ts") },
    { find: "@mithril/workflows", replacement: pkg("workflows/src/index.ts") },
    { find: "@mithril/otel", replacement: pkg("otel/src/index.ts") },
    { find: "@mithril/mcp/server", replacement: pkg("mcp/src/server.ts") },
    { find: "@mithril/mcp", replacement: pkg("mcp/src/index.ts") },
    { find: "@mithril/react/hooks", replacement: pkg("react/src/hooks.ts") },
    { find: "@mithril/react", replacement: pkg("react/src/index.ts") },
    { find: "@mithril/devtools/ui.css", replacement: pkg("devtools/src/ui/ui.css") },
    { find: "@mithril/devtools/ui", replacement: pkg("devtools/src/ui/index.tsx") },
    { find: "@mithril/devtools/dom", replacement: pkg("devtools/src/dom.ts") },
    { find: "@mithril/devtools/element", replacement: pkg("devtools/src/element.ts") },
    { find: "@mithril/devtools/attach", replacement: pkg("devtools/src/attach.ts") },
    { find: "@mithril/devtools", replacement: pkg("devtools/src/index.ts") },
    { find: "@mithril/spec/parse", replacement: pkg("spec/src/parse.ts") },
    { find: "@mithril/spec", replacement: pkg("spec/src/index.ts") },
    { find: "@mithril/runner-web/worker", replacement: pkg("runner-web/src/worker.ts") },
    { find: "@mithril/runner-web", replacement: pkg("runner-web/src/index.ts") },
    { find: "mithril/openai", replacement: pkg("mithril/src/openai.ts") },
    { find: "mithril/anthropic", replacement: pkg("mithril/src/anthropic.ts") },
    { find: "mithril/transformers", replacement: pkg("mithril/src/transformers.ts") },
    { find: "mithril", replacement: pkg("mithril/src/index.ts") },
  ];
}
