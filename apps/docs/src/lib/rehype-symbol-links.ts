/**
 * Rehype plugin: turn inline-code mentions of a known Mithril symbol (e.g.
 * `RunResult`) into a link to its reference page, with a hover tooltip showing
 * its definition. Only touches INLINE code — never fenced code blocks, headings,
 * or text already inside a link. Zero dependencies (manual HAST walk).
 */
import { symbols, type SymbolDef } from "./load-symbols.ts";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface Ctx {
  block: boolean; // inside <pre> or an expressive-code figure
  heading: boolean; // inside <h1>–<h6>
  link: boolean; // inside an <a>
}

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function isCodeBlock(node: HastNode): boolean {
  if (node.tagName === "pre") return true;
  const cls = node.properties?.["className"];
  return Array.isArray(cls) && cls.some((c) => String(c).includes("expressive-code"));
}

function anchor(name: string, def: SymbolDef): HastNode {
  return {
    type: "element",
    tagName: "a",
    properties: { className: ["sym"], href: def.href, "data-kind": def.kind },
    children: [
      { type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: name }] },
      {
        type: "element",
        tagName: "span",
        properties: { className: ["sym-tip"], role: "tooltip" },
        children: [
          { type: "element", tagName: "span", properties: { className: ["sym-tip-kind"] }, children: [{ type: "text", value: def.kind }] },
          { type: "element", tagName: "span", properties: { className: ["sym-tip-sig"] }, children: [{ type: "text", value: def.sig }] },
        ],
      },
    ],
  };
}

function walk(node: HastNode, ctx: Ctx, S: Readonly<Record<string, SymbolDef>>): void {
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || child.type !== "element") continue;

    const isInlineSymbol =
      child.tagName === "code" &&
      !ctx.block &&
      !ctx.heading &&
      !ctx.link &&
      child.children?.length === 1 &&
      child.children[0]?.type === "text" &&
      typeof child.children[0]?.value === "string" &&
      Object.prototype.hasOwnProperty.call(S, child.children[0].value);

    if (isInlineSymbol) {
      const name = child.children![0]!.value as string;
      children[i] = anchor(name, S[name]!);
      continue; // don't descend into the freshly-built anchor
    }

    walk(
      child,
      {
        block: ctx.block || isCodeBlock(child),
        heading: ctx.heading || (child.tagName !== undefined && HEADINGS.has(child.tagName)),
        link: ctx.link || child.tagName === "a",
      },
      S,
    );
  }
}

export default function rehypeSymbolLinks() {
  return (tree: HastNode): void => walk(tree, { block: false, heading: false, link: false }, symbols());
}
