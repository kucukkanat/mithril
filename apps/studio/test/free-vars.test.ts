/*
 * The unbound-reference check behind the build review's loudest warning.
 *
 * The bias under test is as important as the detection: this scan is allowed to MISS a free name,
 * and is never allowed to invent one. A false warning on a working body teaches you to ignore the
 * notes, and the notes are the only place the host admits what it had to fix.
 */
import { describe, expect, test } from "bun:test";
import { freeIdentifiers } from "../src/lib/free-vars.ts";

const none = new Set<string>();

describe("catches what the generated file cannot resolve", () => {
  test("the exact bug: storage used without use_storage", () => {
    expect(freeIdentifiers("async ({ note }) => { await notes.set(note, true); }", none)).toEqual(["notes"]);
  });

  test("and stays silent once the binding is provided", () => {
    expect(freeIdentifiers("async ({ note }) => { await notes.set(note, true); }", new Set(["notes"]))).toEqual([]);
  });

  test("reports each name once, in first-appearance order", () => {
    expect(freeIdentifiers("async () => { db.q(); cache.get(); db.q(); }", none)).toEqual(["db", "cache"]);
  });

  test("a free name inside a template hole is still a reference", () => {
    expect(freeIdentifiers("async ({ id }) => `/users/${prefix}/${id}`", none)).toEqual(["prefix"]);
  });
});

describe("never accuses working code", () => {
  test.each([
    ["destructured inputs", "async ({ city, days }) => ({ city, days })"],
    ["the whole-argument form", "async (args) => args.city"],
    ["locals of every kind", "async () => { const a = 1; let b = 2; var c = 3; function f() {} class K {} return [a, b, c, f, K]; }"],
    ["destructured locals", "async ({ raw }) => { const { x, y } = raw; const [p, q] = raw.pair; return x + y + p + q; }"],
    ["a catch binding", "async ({ url }) => { try { return await fetch(url); } catch (err) { return err; } }"],
    ["nested callback params", "async ({ items }) => items.map((item, i) => item.name + i)"],
    ["for-of bindings", "async ({ xs }) => { for (const x of xs) { console.log(x); } }"],
    ["standard globals", "async ({ n }) => JSON.stringify({ t: Date.now(), n: Math.round(n), u: new URL('https://x.dev') })"],
    ["fetch and friends", "async ({ q }) => (await fetch(`https://x.dev?q=${encodeURIComponent(q)}`)).json()"],
    ["property names that shadow nothing", "async () => ({ notes: 1, db: 2 })"],
    ["method calls on a bound value", "async ({ s }) => s.trim().toUpperCase()"],
    ["names that only appear in a string", 'async () => ({ msg: "call notes.set to save" })'],
    ["names that only appear in a comment", "async () => {\n  // notes.set would go here\n  return { ok: true };\n}"],
    ["a block comment", "async () => {\n  /* uses db elsewhere */\n  return 1;\n}"],
    ["the runner's injected globals", "async () => { emit({ x: 1 }); return usage; }"],
    ["zod, which the file always imports", "async () => z.string().parse('x')"],
  ])("%s", (_label, code) => {
    expect(freeIdentifiers(code, none)).toEqual([]);
  });

  test("locals declared for the storage handle it was given", () => {
    expect(freeIdentifiers("async ({ k }) => { const prev = await store.get(k); return prev ?? null; }", new Set(["store"]))).toEqual([]);
  });

  test("a stub body is clean", () => {
    expect(freeIdentifiers("async ({ city }) => {\n  // TODO: call your real API here.\n  return { ok: true };\n}", none)).toEqual([]);
  });
});
