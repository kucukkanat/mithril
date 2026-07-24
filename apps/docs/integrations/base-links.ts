/**
 * Astro integration: after the build, prefix the site `base` onto every root-absolute internal
 * link in the emitted HTML (e.g. `href="/guides/foo/"` → `href="/mithril/guides/foo/"`).
 *
 * Astro already bases assets and Starlight's own navigation, but NOT links authored in content,
 * MDX components (`<LinkCard>`), `.astro` pages, or the generated symbol/reference links — those
 * stay root-absolute and 404 under the project-page prefix. Rewriting the built HTML in one place
 * fixes them all without touching any source, and stays correct as new pages/links are added.
 *
 * Only touches `href`/`src` values that are root-absolute (`/…`), skipping external URLs,
 * protocol-relative (`//…`) links, and anything already based — so it is safe and idempotent.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

async function* htmlFiles(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

export function baseLinks({ base }: { base: string }) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base; // normalise: no trailing slash
  // Root-absolute href/src, not protocol-relative (`//`).
  const re = /\b(href|src)="(\/(?!\/)[^"]*)"/g;
  const rewrite = (html: string): string =>
    html.replace(re, (match, attr: string, url: string) =>
      url === b || url.startsWith(`${b}/`) ? match : `${attr}="${b}${url}"`,
    );

  return {
    name: "mithril-base-links",
    hooks: {
      "astro:build:done": async ({ dir }: { dir: URL }) => {
        const root = fileURLToPath(dir);
        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, "utf8");
          const out = rewrite(html);
          if (out !== html) await writeFile(file, out);
        }
      },
    },
  };
}
