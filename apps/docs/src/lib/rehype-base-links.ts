/**
 * Rehype plugin: prefix the site {@link BASE} onto every root-absolute internal `href`/`src` in
 * rendered Markdown/MDX content (e.g. `/guides/foo/` → `/mithril/guides/foo/`). Authors keep
 * writing root-absolute cross-links per the docs convention; this applies the base at build time so
 * links resolve under the project-page prefix instead of 404ing.
 *
 * Idempotent and conservative: it skips external URLs, protocol-relative (`//…`) and anchor links,
 * and anything already based — so it is safe to run after {@link rehypeSymbolLinks} (whose injected
 * symbol anchors are already based via `load-symbols`).
 */
import { withBase } from "./base.ts";

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const ATTRS = ["href", "src"] as const;

function walk(node: HastNode): void {
  if (node.type === "element" && node.properties) {
    for (const attr of ATTRS) {
      const value = node.properties[attr];
      if (typeof value === "string") node.properties[attr] = withBase(value);
    }
  }
  if (node.children) for (const child of node.children) walk(child);
}

export default function rehypeBaseLinks() {
  return (tree: HastNode): void => walk(tree);
}
