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

const root = fileURLToPath(new URL("..", import.meta.url));
const SYMBOLS = symbols();

const failures: string[] = [];
for (const [name, def] of Object.entries(SYMBOLS)) {
  if (!def.href.startsWith("/reference/")) {
    failures.push(`${name}: href "${def.href}" is not under /reference/`);
    continue;
  }
  if (!existsSync(`${root}dist${def.href}index.html`)) {
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
