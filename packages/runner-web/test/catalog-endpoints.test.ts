import { expect, test } from "bun:test";
import { liveProvider, type LiveProviderId } from "../src/catalog.ts";

/*
 * Drift guard. The catalog's `defaultBaseUrl` is what the picker shows as a placeholder AND what the
 * connection probe calls — so if it ever disagrees with the endpoint the provider adapter actually
 * uses, "Test connection" would validate a different URL than a run, which is exactly the confusion
 * the feature exists to remove. The adapters don't export their defaults, so this reads them from the
 * source instead of duplicating them.
 */

const SOURCE: Record<Exclude<LiveProviderId, never>, { readonly file: string; readonly pattern: RegExp }> = {
  openai: { file: "openai/index.ts", pattern: /defaultBaseUrl:\s*"([^"]+)"/ },
  anthropic: { file: "anthropic/index.ts", pattern: /const DEFAULT_BASE = "([^"]+)"/ },
  google: { file: "google/index.ts", pattern: /const DEFAULT_BASE = "([^"]+)"/ },
  deepseek: { file: "deepseek/index.ts", pattern: /defaultBaseUrl:\s*"([^"]+)"/ },
  openrouter: { file: "openrouter/index.ts", pattern: /defaultBaseUrl:\s*"([^"]+)"/ },
  // Groq has no adapter of its own — it is `openaiProvider({ baseUrl })`, so the catalog IS the source.
  groq: { file: "", pattern: /^$/ },
};

test("catalog defaultBaseUrl matches each provider adapter's own default", async () => {
  for (const [id, { file, pattern }] of Object.entries(SOURCE) as [LiveProviderId, (typeof SOURCE)[LiveProviderId]][]) {
    if (file === "") continue;
    const src = await Bun.file(new URL(`../../providers/src/${file}`, import.meta.url)).text();
    const found = pattern.exec(src)?.[1];
    expect(found, `no default base URL found in providers/src/${file}`).toBeDefined();
    expect(liveProvider(id).defaultBaseUrl, `catalog drifted from providers/src/${file}`).toBe(found!);
  }
});
