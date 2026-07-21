import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// An llms.txt index (https://llmstxt.org) so AI assistants can consume the docs.
// Generated at build time from the docs content collection.

const GROUP_ORDER = ["getting-started", "concepts", "guides", "reference", "design"] as const;
const GROUP_LABEL: Record<string, string> = {
  "getting-started": "Getting started",
  concepts: "Concepts",
  guides: "Guides",
  reference: "API reference",
  design: "Design & internals",
  _root: "Top level",
};

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "";
  const docs = await getCollection("docs");

  const groups = new Map<string, { title: string; desc: string; url: string; order: number }[]>();
  for (const entry of docs) {
    const id = entry.id;
    const top = id.includes("/") ? id.split("/")[0]! : "_root";
    const url = `${base}/${id}/`;
    const order = (entry.data.sidebar?.order as number | undefined) ?? 999;
    const list = groups.get(top) ?? [];
    list.push({ title: entry.data.title, desc: entry.data.description ?? "", url, order });
    groups.set(top, list);
  }

  const lines: string[] = [
    "# Mithril",
    "",
    "> The most developer-friendly AI agent harness. TypeScript-first, provider-agnostic, and it genuinely runs in the browser. The typed, versioned event stream is the product.",
    "",
    "Mithril is a batteries-included AI-agent harness whose public contract is a single typed event stream (`MithrilEvent`). It runs identically on Node, Bun, and browsers over a web-standards-only core.",
    "",
  ];

  const seen = new Set<string>();
  const emit = (key: string) => {
    const list = groups.get(key);
    if (!list) return;
    seen.add(key);
    lines.push(`## ${GROUP_LABEL[key] ?? key}`, "");
    for (const item of list.sort((a, b) => a.order - b.order)) {
      lines.push(`- [${item.title}](${item.url})${item.desc ? `: ${item.desc}` : ""}`);
    }
    lines.push("");
  };

  for (const key of GROUP_ORDER) emit(key);
  for (const key of groups.keys()) if (!seen.has(key)) emit(key);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
