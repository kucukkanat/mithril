/**
 * Lazily load the symbol registry from `symbols.json` (produced during the build by the
 * `mithril-gen-symbols` integration, from the TypeDoc reference). Read at transform time — not at
 * import time — so the registry is already written by the time the link plugins run. Cached once a
 * non-empty registry is available.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { withBase } from "./base.ts";

export interface SymbolDef {
  readonly href: string;
  readonly kind: "fn" | "type" | "class" | "const";
  readonly sig: string;
}

const jsonPath = fileURLToPath(new URL("./symbols.json", import.meta.url));
let cache: Readonly<Record<string, SymbolDef>> | null = null;

export function symbols(): Readonly<Record<string, SymbolDef>> {
  if (cache) return cache;
  try {
    const data = JSON.parse(readFileSync(jsonPath, "utf8")) as Record<string, SymbolDef>;
    // symbols.json stores base-less hrefs (`/reference/…`); apply the site base at load time so
    // symbol links resolve under the project-page prefix in both prose and code examples.
    const based: Record<string, SymbolDef> = {};
    for (const [name, def] of Object.entries(data)) based[name] = { ...def, href: withBase(def.href) };
    if (Object.keys(based).length > 0) cache = based; // only cache once populated
    return based;
  } catch {
    return {};
  }
}
