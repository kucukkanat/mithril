import { defineEcConfig } from "@astrojs/starlight/expressive-code";
import { ecSymbolLinks } from "./src/lib/ec-symbol-links.ts";

// Expressive Code config lives here (not inline in astro.config) so the `<Code>` component — used by the
// Runnable playground blocks — can load it; inline config with a plugin function isn't JSON-serializable.
// Markdown code fences and <Code> both read this, so symbol tooltips + themes stay identical across the site.
export default defineEcConfig({
  themes: ["github-dark-default", "github-light-default"],
  styleOverrides: { borderRadius: "0.5rem" },
  plugins: [ecSymbolLinks()],
});
