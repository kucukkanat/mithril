import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error — plain .mjs module shared with apps/docs' astro.config.mjs
import { mithrilAliases } from "../../scripts/mithril-aliases.mjs";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The shared @mithril/* → source-.ts alias list (scripts/mithril-aliases.mjs) — the same
    // code that ships to npm is what the Studio bundles, and docs/studio can never drift.
    alias: mithrilAliases() as { find: string; replacement: string }[],
  },
  optimizeDeps: {
    // `sucrase`/`zod`/`typescript` are imported only inside Web Workers, so Vite doesn't discover
    // them from the main entry. Without pre-bundling, the first Run (or first code edit) triggers
    // "optimized dependencies changed" and a full page reload mid-action.
    include: ["sucrase", "zod", "typescript", "react", "react-dom", "@xyflow/react"],
    // Transformers.js (+ onnxruntime-web/WASM) is too heavy for the dev optimizer (504s) and the
    // worker gets no auto-reload recovery. Serve the chain raw; production Rollup bundles it fine.
    exclude: ["@huggingface/transformers", "onnxruntime-web", "@huggingface/jinja", "@huggingface/tokenizers"],
  },
  // Workers must be ES modules: the runner worker code-splits (lazy transformers import), which
  // Rollup can't express in the default IIFE worker format.
  worker: { format: "es" },
  build: { target: "es2022" },
});
