/**
 * Expressive Code plugin: make symbol references inside fenced code examples
 * clickable. After a line is rendered, we wrap any highlight token whose text is
 * exactly a known Mithril symbol (e.g. `RunResult`) in a link to its reference
 * page, preserving the token's syntax color and adding a native tooltip.
 *
 * Because we only match a token whose ENTIRE text equals a symbol, strings and
 * comments (which tokenize as one larger span) are naturally left alone.
 */
import { symbols, type SymbolDef } from "./load-symbols.ts";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function wrapSymbols(node: HastNode, S: Readonly<Record<string, SymbolDef>>): void {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || child.type !== "element") continue;
    if (child.tagName === "a") {
      wrapSymbols(child, S); // already linked — just descend
      continue;
    }
    const only = child.children?.length === 1 ? child.children[0] : undefined;
    const text = only && only.type === "text" ? only.value : undefined;
    if (typeof text === "string" && Object.prototype.hasOwnProperty.call(S, text)) {
      const def = S[text]!;
      children[i] = {
        type: "element",
        tagName: "a",
        properties: {
          className: ["sym-code"],
          href: def.href,
          title: `${def.kind} · ${def.sig}`,
        },
        children: [child], // keep the colored token as the link's content
      };
      continue;
    }
    wrapSymbols(child, S);
  }
}

export function ecSymbolLinks() {
  return {
    name: "mithril-symbol-links",
    hooks: {
      postprocessRenderedLine: (context: { renderData: { lineAst: HastNode } }) => {
        wrapSymbols(context.renderData.lineAst, symbols());
      },
    },
  };
}
