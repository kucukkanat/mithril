/*
 * The capability menu, and the one promise it makes: everything the model is TOLD about is
 * something the host can actually emit and the runner can actually serve.
 *
 * That promise is the whole feature. The original bug was a model writing storage code the
 * generated file had no import for; offering a capability the host cannot wire up would recreate it
 * with extra steps.
 */
import { describe, expect, test } from "bun:test";
import { CAPABILITIES, capabilityCatalogue, capabilityOf, capabilitySetup } from "../src/lib/capabilities.ts";

describe("the menu is internally consistent", () => {
  test("ids are unique and lookup-able", () => {
    expect(new Set(CAPABILITIES.map((c) => c.id)).size).toBe(CAPABILITIES.length);
    for (const c of CAPABILITIES) expect(capabilityOf(c.id)).toBe(c);
  });

  test("an unknown id resolves to nothing", () => {
    expect(capabilityOf("postgres")).toBeUndefined();
  });

  test("every advertised factory is a real export of its module", async () => {
    for (const cap of CAPABILITIES) {
      const mod = (await import(cap.module)) as Record<string, unknown>;
      expect(typeof mod[cap.factory]).toBe("function");
    }
  });

  test("every factory really is callable with no arguments, as the setup line assumes", async () => {
    for (const cap of CAPABILITIES) {
      const mod = (await import(cap.module)) as Record<string, () => unknown>;
      const make = mod[cap.factory];
      expect(make).toBeDefined();
      // The generated line is `const x = factory()`. A factory that needed an argument would emit
      // code that throws on module evaluation — before a single tool ever runs.
      expect(typeof make?.()).toBe("object");
    }
  });

  test("every method the catalogue advertises exists on the thing the factory returns", async () => {
    for (const cap of CAPABILITIES) {
      const mod = (await import(cap.module)) as Record<string, () => Record<string, unknown>>;
      const store = mod[cap.factory]?.();
      // "Identical to `files`" and prose lines carry no `store.x(` — only real signatures do.
      for (const line of cap.api) {
        const method = /store\.([A-Za-z_$][\w$]*)\s*\(/.exec(line)?.[1];
        if (method !== undefined) expect(typeof store?.[method]).toBe("function");
      }
    }
  });
});

describe("setup emits two separate statements", () => {
  test("the import, then the const", () => {
    const cap = capabilityOf("kv");
    expect(cap).toBeDefined();
    if (cap === undefined) return;
    expect(capabilitySetup(cap, "facts")).toEqual([`import { indexedDbKv } from "@mithril/kv/indexeddb";`, "const facts = indexedDbKv();"]);
  });

  test("the import matches the exact form parseProject regenerates, so a round-trip is stable", () => {
    for (const cap of CAPABILITIES) {
      const [importLine] = capabilitySetup(cap, "x");
      expect(importLine).toBe(`import { ${cap.factory} } from ${JSON.stringify(cap.module)};`);
    }
  });
});

describe("the catalogue the model is shown", () => {
  test("names every capability and says which ones survive a reload", () => {
    const text = capabilityCatalogue();
    for (const c of CAPABILITIES) expect(text).toContain(c.id);
    expect(text).toContain("persists across runs");
    expect(text).toContain("in-memory, lost when the run ends");
  });

  test("carries the API, so the model has no reason to guess a method name", () => {
    const text = capabilityCatalogue();
    expect(text).toContain("store.writeFile");
    expect(text).toContain("store.set(key, value)");
    // The kv store genuinely has no enumeration; a model that assumes one writes a broken recall tool.
    expect(text).toContain("THERE IS NO list/keys METHOD");
  });

  test("at least one persistent option exists — the whole point is remembering", () => {
    expect(CAPABILITIES.some((c) => c.persistent)).toBe(true);
  });
});
