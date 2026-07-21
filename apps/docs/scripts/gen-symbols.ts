/**
 * Derive the symbol-link registry from the TypeDoc-generated reference pages and write it to
 * `src/lib/symbols.json`. This runs automatically inside the Astro build (see the
 * `mithril-gen-symbols` integration in astro.config.mjs) right after TypeDoc emits the reference,
 * so a single `docs:build` produces correct links — no double build. Also runnable standalone:
 *
 *   bun run apps/docs/scripts/gen-symbols.ts
 *
 * name → { href (generated page), kind, sig }. Powers rehype-symbol-links.ts (prose) and
 * ec-symbol-links.ts (code examples).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const refDir = `${root}src/content/docs/reference`;
const contentRoot = `${root}src/content/docs`;
const outFile = `${root}src/lib/symbols.json`;

const KIND: Record<string, "fn" | "type" | "class" | "const"> = {
  functions: "fn",
  classes: "class",
  variables: "const",
  interfaces: "type",
  "type-aliases": "type",
  enumerations: "type",
};

// Names we don't auto-link: common English / status words that also happen to be API symbols,
// so an inline-code mention is often NOT the API (the tooltip can't disambiguate).
const SKIP = new Set(["done", "completed"]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, files);
    else if (entry.endsWith(".md")) files.push(full);
  }
  return files;
}

/** First prose sentence after the title (the TSDoc summary), md-links stripped. */
function summaryOf(md: string): string {
  const afterFm = md.replace(/^---[\s\S]*?---\n/, "");
  for (const line of afterFm.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("```") || t.startsWith("|") || t.startsWith("<") || t.startsWith("Defined in")) continue;
    return t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "");
  }
  return "";
}

/** A concise tooltip: the real signature for functions/types/classes, else the summary. */
function signatureOf(md: string): string {
  const m = /```ts\n([\s\S]*?)```/.exec(md);
  const body = (m?.[1] ?? "").replace(/\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
  const isSignature = /^(function|type|class|abstract|new|enum|const)\b/.test(body);
  const raw = isSignature && body ? body : summaryOf(md);
  return raw.length > 140 ? `${raw.slice(0, 139)}…` : raw;
}

export interface SymbolDef {
  href: string;
  kind: "fn" | "type" | "class" | "const";
  sig: string;
}

/** Build the registry from the generated reference and write src/lib/symbols.json. Returns the count. */
export function generateSymbols(): number {
  if (!existsSync(refDir)) {
    writeFileSync(outFile, "{}\n");
    return 0;
  }
  const symbols = new Map<string, SymbolDef>();
  for (const file of walk(refDir)) {
    const rel = file.slice(contentRoot.length).replace(/\.md$/, "");
    const parts = rel.split("/").filter(Boolean);
    const name = parts.at(-1)!;
    const kind = KIND[parts.at(-2) ?? ""];
    if (!kind || name.toLowerCase() === "readme" || SKIP.has(name)) continue;
    const href = `${rel.toLowerCase()}/`; // Starlight lowercases slugs
    const existing = symbols.get(name);
    if (existing && !href.startsWith("/reference/core/")) continue; // prefer core on collision
    symbols.set(name, { href, kind, sig: signatureOf(readFileSync(file, "utf8")) });
  }
  const sorted = [...symbols.entries()].sort(([a], [b]) => a.localeCompare(b));
  const obj = Object.fromEntries(sorted);
  writeFileSync(outFile, `${JSON.stringify(obj, null, 2)}\n`);
  return sorted.length;
}

if (import.meta.main) {
  const n = generateSymbols();
  console.log(`✓ wrote ${n} symbols to src/lib/symbols.json`);
}
