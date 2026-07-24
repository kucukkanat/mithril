// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import { mithrilAliases } from "../../scripts/mithril-aliases.mjs";
import rehypeSymbolLinks from "./src/lib/rehype-symbol-links.ts";
import rehypeBaseLinks from "./src/lib/rehype-base-links.ts";
import { BASE } from "./src/lib/base.ts";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";
import { generateSymbols } from "./scripts/gen-symbols.ts";

/**
 * Regenerate the symbol-link registry (symbols.json) from the freshly generated TypeDoc reference,
 * on `astro:config:done` — which runs after Starlight's TypeDoc plugins have emitted `reference/`,
 * but before content is rendered. The link plugins read symbols.json lazily, so ONE `docs:build`
 * produces correct links (no double build).
 */
const genSymbolsIntegration = {
  name: "mithril-gen-symbols",
  hooks: { "astro:config:done": () => void generateSymbols() },
};

/**
 * The reference section is GENERATED from the framework source (TypeDoc + TSDoc), never hand-
 * written, so it can't drift. One starlight-typedoc instance per package gives clean
 * `/reference/<pkg>/…` URLs. Each package's public API doc lives in its TSDoc comments in source.
 */
const TD_PACKAGES = [
  { name: "core", label: "@mithril/core", entryPoints: ["core/src/protocol/index.ts", "core/src/agent/index.ts", "core/src/testkit/index.ts"] },
  { name: "providers", label: "@mithril/providers", entryPoints: ["providers/src/openai/index.ts", "providers/src/anthropic/index.ts", "providers/src/google/index.ts", "providers/src/transformers/index.ts"] },
  { name: "memory", label: "@mithril/memory", entryPoints: ["memory/src/index.ts", "memory/src/sqlite-bun.ts", "memory/src/sqlite-node.ts"] },
  { name: "kv", label: "@mithril/kv", entryPoints: ["kv/src/index.ts", "kv/src/indexeddb.ts", "kv/src/sqlite-node.ts"] },
  { name: "fs", label: "@mithril/fs", entryPoints: ["fs/src/index.ts", "fs/src/node.ts", "fs/src/opfs.ts"] },
  { name: "otel", label: "@mithril/otel", entryPoints: ["otel/src/index.ts"] },
  { name: "workflows", label: "@mithril/workflows", entryPoints: ["workflows/src/index.ts"] },
  { name: "mcp", label: "@mithril/mcp", entryPoints: ["mcp/src/index.ts", "mcp/src/http.ts", "mcp/src/server.ts"] },
  { name: "vectors", label: "@mithril/vectors", entryPoints: ["vectors/src/index.ts", "vectors/src/sqlite-bun.ts", "vectors/src/sqlite-node.ts"] },
  { name: "sandbox", label: "@mithril/sandbox", entryPoints: ["sandbox/src/index.ts", "sandbox/src/node.ts"] },
  { name: "react", label: "@mithril/react", entryPoints: ["react/src/index.ts", "react/src/hooks.ts"] },
  { name: "runner-web", label: "@mithril/runner-web", entryPoints: ["runner-web/src/index.ts", "runner-web/src/worker.ts"] },
  { name: "spec", label: "@mithril/spec", entryPoints: ["spec/src/index.ts", "spec/src/parse.ts"] },
  { name: "devtools", label: "@mithril/devtools", entryPoints: ["devtools/src/index.ts", "devtools/src/dom.ts", "devtools/src/element.ts", "devtools/src/attach.ts"] },
  { name: "create-mithril", label: "create-mithril", entryPoints: ["create-mithril/src/index.ts"] },
];

/** @type {import("@astrojs/starlight/types").StarlightPlugin[]} */
const typeDocPlugins = [];
/** @type {any[]} */
const typeDocSidebar = [];
for (const pkg of TD_PACKAGES) {
  const [plugin, sidebarGroup] = createStarlightTypeDocPlugin();
  typeDocPlugins.push(
    plugin({
      entryPoints: pkg.entryPoints.map((e) => `../../packages/${e}`),
      tsconfig: `../../packages/${pkg.name}/tsconfig.json`,
      output: `reference/${pkg.name}`,
      sidebar: { label: pkg.label, collapsed: true },
      typeDoc: {
        readme: "none",
        skipErrorChecking: true,
        expandObjects: true,
        useCodeBlocks: true,
        parametersFormat: "table",
        hidePageHeader: true,
      },
    }),
  );
  typeDocSidebar.push(sidebarGroup);
}

// The @mithril/* → source-.ts alias list lives in scripts/mithril-aliases.mjs, shared with
// apps/studio's vite.config.ts so the two bundler configs can never drift.

// https://astro.build/config
export default defineConfig({
  site: "https://kucukkanat.github.io",
  base: BASE,
  integrations: [
    starlight({
      title: "Mithril",
      plugins: typeDocPlugins,
      description:
        "The most developer-friendly AI agent harness. TypeScript-first, provider-agnostic, and it genuinely runs in the browser.",
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/kucukkanat/mithril" }],
      lastUpdated: false,
      head: [
        { tag: "meta", attrs: { name: "theme-color", content: "#0b0d11" } },
        { tag: "meta", attrs: { property: "og:site_name", content: "Mithril" } },
      ],
      customCss: ["./src/styles/tokens.css", "./src/styles/theme.css"],
      // Expressive Code config moved to ./ec.config.mjs so the <Code> component (Runnable blocks) can load it.
      sidebar: [
        {
          label: "Getting started",
          items: [{ autogenerate: { directory: "getting-started" } }],
        },
        { label: "Concepts", items: [{ autogenerate: { directory: "concepts" } }] },
        {
          // Grouped by task rather than a flat 21-item list, so a newcomer can scan by intent.
          // Entries are slugs (no file moves → every URL and cross-link stays stable); order here
          // is the source of truth for the sidebar, so the pages' frontmatter `order` is unused.
          label: "Guides",
          items: [
            {
              label: "Core",
              items: [
                "guides/defining-tools",
                "guides/building-agents",
                "guides/streaming",
                "guides/structured-output",
                "guides/error-handling",
                "guides/self-correction",
              ],
            },
            {
              label: "State & humans",
              items: [
                "guides/human-in-the-loop",
                "guides/memory-and-checkpointing",
                "guides/multi-agent",
              ],
            },
            {
              label: "Extending the loop",
              items: [
                "guides/middleware-and-plugins",
                "guides/mcp",
                "guides/workflows",
                "guides/rag-and-vectors",
                "guides/ejecting-the-loop",
              ],
            },
            {
              label: "Frontend & browser",
              items: [
                "guides/react",
                "guides/devtools",
                "guides/streaming-to-a-web-ui",
                "guides/running-in-the-browser",
                "guides/local-inference",
                "guides/studio",
              ],
            },
            {
              label: "Quality & ops",
              items: [
                "guides/testing-your-agent",
                "guides/observability",
              ],
            },
          ],
        },
        { label: "API reference", collapsed: true, items: [{ label: "Overview", link: "/reference/" }, ...typeDocSidebar] },
        {
          label: "Playground",
          link: "/playground/",
          badge: { text: "live", variant: "tip" },
        },
        { label: "Roadmap", link: "/roadmap/" },
        {
          label: "Design & internals",
          items: [{ autogenerate: { directory: "design" } }],
        },
      ],
      pagefind: true,
    }),
    react(),
    genSymbolsIntegration,
  ],
  markdown: {
    // Auto-link inline-code symbol mentions to the reference (symbol anchors are already based via
    // load-symbols), THEN prefix the site base onto every remaining root-absolute internal link.
    rehypePlugins: [rehypeSymbolLinks, rehypeBaseLinks],
  },
  vite: {
    resolve: { alias: mithrilAliases() },
    optimizeDeps: {
      // `sucrase` + `zod` are imported ONLY by the runner Web Worker, so Vite doesn't discover them in the
      // main entry. Without pre-bundling them here, Vite optimizes them the FIRST time you click Run, and
      // "optimized dependencies changed" forces a full page reload mid-click — the "Run causes a reload" bug.
      include: ["sucrase", "zod"],
      // Transformers.js (+ its onnxruntime-web/WASM) is too heavy for Vite's dev optimizer (it 504s), and the
      // worker gets no auto-reload recovery, so its dynamic `import("@huggingface/transformers")` fails.
      // Serve the whole chain raw (production Rollup bundles it fine); excluding the transitive deps also
      // stops the separate on-demand-optimize reload the first time a Local model runs.
      exclude: ["@huggingface/transformers", "onnxruntime-web", "@huggingface/jinja", "@huggingface/tokenizers"],
    },
  },
});
