/**
 * The site base path (project-page deploy at `https://kucukkanat.github.io/mithril/`). This is the
 * SINGLE source of truth: `astro.config.mjs` reads `BASE` for its `base` option, the build-time
 * link plugins (`rehype-base-links.ts`, symbol loaders) prefix it onto root-absolute internal
 * links, and components call {@link withBase} on hand-written hrefs. Authors keep writing
 * root-absolute links (`/guides/…`) — the base is applied here, at build time, so nothing 404s
 * under the `/mithril/` prefix.
 */
export const BASE = "/mithril";

/**
 * Prefix an internal root-absolute path with {@link BASE}. Idempotent (already-prefixed paths are
 * returned unchanged) and a no-op for external, protocol-relative (`//…`), anchor, and non-absolute
 * links, so it is safe to apply broadly.
 */
export function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path; // external / protocol-relative / relative
  if (path === BASE || path.startsWith(`${BASE}/`)) return path; // already based
  return `${BASE}${path}`;
}
