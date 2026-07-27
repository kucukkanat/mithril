import { describe, expect, test } from "bun:test";
import { generateProject } from "@mithril/spec";
import { parseProject } from "@mithril/spec/parse";
import ts from "typescript";
import { TEMPLATES, blankProject, templateSpec, uniqueName } from "../src/lib/defaults.ts";

/*
 * The gallery promises "each arrives with its examples already failing" — which is only honest if the
 * templates are real, runnable specs. These tests hold that line: every template must generate valid
 * TypeScript that the parser can lift straight back into an equivalent spec.
 */

describe("templates", () => {
  test("the design's six templates are all present, exactly one featured", () => {
    expect(TEMPLATES).toHaveLength(6);
    expect(TEMPLATES.filter((t) => t.featured === true)).toHaveLength(1);
  });

  test("ids and names are unique", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATES.length);
  });

  test("only the frontier template needs a key; everything else runs on-device", () => {
    for (const t of TEMPLATES) {
      const usesLive = t.spec.decls.some((d) => d.kind === "agent" && d.model.kind === "live");
      expect(usesLive).toBe(t.needsKey === true);
    }
  });

  test("every template ships seed cases, and the featured one ships three", () => {
    for (const t of TEMPLATES) expect(t.cases.length).toBeGreaterThan(0);
    expect(TEMPLATES.find((t) => t.featured)?.cases).toHaveLength(3);
  });

  test.each(TEMPLATES.map((t) => [t.id, t] as const))("%s generates code the parser round-trips", (_id, template) => {
    const code = generateProject(template.spec);
    const result = parseProject(code, ts);
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(result.spec).toBeDefined();
    expect(result.spec?.entry.target).toBe(template.spec.entry.target);
    // EVERY template must be fully structured, multi-agent ones included: an opaque decl here would
    // mean the Designer shows a verbatim block where a panel belongs. This held for `asTool` only
    // once the parser learned to recognize it (see parse.ts).
    expect(result.opaqueCount).toBe(0);
    expect(result.spec?.decls.map((d) => d.id)).toEqual(template.spec.decls.map((d) => d.id));
  });

  test.each(TEMPLATES.map((t) => [t.id, t] as const))("%s regenerates to compilable, settled code", (_id, template) => {
    // The Designer regenerates code on every spec edit, so a template whose round-trip redeclared a
    // binding or never settled would corrupt itself the first time a user touched the Code tab.
    const first = generateProject(template.spec);
    const parsed = parseProject(first, ts, template.spec);
    const second = generateProject(parsed.spec as NonNullable<typeof parsed.spec>);
    const settled = generateProject(parseProject(second, ts, parsed.spec).spec as NonNullable<typeof parsed.spec>);
    expect(settled).toBe(second); // a fixed point after at most one pass

    const sf = ts.createSourceFile("p.ts", second, ts.ScriptTarget.ES2022, true);
    const seen = new Map<string, number>();
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt)) continue;
      const bindings = stmt.importClause?.namedBindings;
      if (bindings === undefined || !ts.isNamedImports(bindings)) continue;
      for (const el of bindings.elements) seen.set(el.name.text, (seen.get(el.name.text) ?? 0) + 1);
    }
    expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
  });

  test.each(TEMPLATES.map((t) => [t.id, t] as const))("%s has a valid entry target and tool references", (_id, template) => {
    const ids = new Set(template.spec.decls.map((d) => d.id));
    expect(ids.has(template.spec.entry.target)).toBe(true);
    for (const d of template.spec.decls) {
      if (d.kind === "agent") for (const t of d.tools) expect(ids.has(t)).toBe(true);
      if (d.kind === "subAgentTool") expect(ids.has(d.agentId)).toBe(true);
    }
  });

  test("declarations are ordered so every reference is declared before use", () => {
    for (const template of TEMPLATES) {
      const seen = new Set<string>();
      for (const d of template.spec.decls) {
        if (d.kind === "agent") for (const t of d.tools) expect(seen.has(t)).toBe(true);
        if (d.kind === "subAgentTool") expect(seen.has(d.agentId)).toBe(true);
        seen.add(d.id);
      }
    }
  });
});

describe("blankProject", () => {
  test("is a runnable single-agent spec that round-trips", () => {
    const spec = blankProject("Untitled");
    const result = parseProject(generateProject(spec), ts);
    expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(result.spec?.decls).toHaveLength(1);
  });
});

describe("uniqueName", () => {
  test("returns the base when free", () => {
    expect(uniqueName("Weather", new Set())).toBe("Weather");
  });

  test("counts up past collisions", () => {
    expect(uniqueName("Weather", new Set(["Weather"]))).toBe("Weather 2");
    expect(uniqueName("Weather", new Set(["Weather", "Weather 2"]))).toBe("Weather 3");
  });
});

describe("templateSpec", () => {
  test("uses the spec's own name and deduplicates it", () => {
    const t = TEMPLATES[0];
    if (t === undefined) throw new Error("no templates");
    expect(templateSpec(t, new Set()).name).toBe(t.spec.name);
    expect(templateSpec(t, new Set([t.spec.name])).name).toBe(`${t.spec.name} 2`);
  });
});
