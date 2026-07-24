/**
 * Guards the symbol registry against broken links. `symbols.ts` is generated from the
 * TypeDoc reference (see gen-symbols.ts), so coverage is inherent — this verifies every
 * symbol's href actually resolves to a built page (catches slug/casing mismatches).
 *
 * Run after `bun run docs:build`:  bun run apps/docs/scripts/check-symbol-links.ts
 * Exits non-zero on any failure so it can gate CI.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { symbols } from "../src/lib/load-symbols.ts";
import { BASE } from "../src/lib/base.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const SYMBOLS = symbols();

const failures: string[] = [];
for (const [name, def] of Object.entries(SYMBOLS)) {
  // hrefs are base-prefixed (`/mithril/reference/…`) for the browser, but Astro emits pages to
  // `dist/reference/…` (base affects URLs, not the output path) — so check the base-relative path.
  const rel = def.href.startsWith(`${BASE}/`) ? def.href.slice(BASE.length) : def.href;
  if (!rel.startsWith("/reference/")) {
    failures.push(`${name}: href "${def.href}" is not under /reference/`);
    continue;
  }
  if (!existsSync(`${root}dist${rel}index.html`)) {
    failures.push(`${name}: no built page at ${def.href}`);
  }
}

const total = Object.keys(SYMBOLS).length;
if (failures.length === 0) {
  console.log(`✓ all ${total} linked symbols resolve to a generated reference page`);
} else {
  console.error(`✗ ${failures.length}/${total} broken symbol links:`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
