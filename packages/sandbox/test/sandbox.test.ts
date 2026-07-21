import { expect, test } from "bun:test";
import { remoteRunner } from "../src/index.ts";
import { nodeVmRunner } from "../src/node.ts";

// ── nodeVmRunner (node:vm; runs natively in Bun/Node) ────────────────────────────────────────────────────
test("nodeVmRunner evaluates an expression and returns its value", async () => {
  const r = await nodeVmRunner().run("const a = 2; a * 21", { timeoutMs: 100 });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);
});

test("nodeVmRunner captures console output", async () => {
  const r = await nodeVmRunner().run("console.log('hello', 1); 0", { timeoutMs: 100 });
  expect(r.logs).toEqual(["hello 1"]);
});

test("nodeVmRunner injects globals and isolates host scope", async () => {
  const r = await nodeVmRunner().run("input.x + 1", { globals: { input: { x: 41 } } });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);
  // host globals are NOT visible inside the vm context
  const leaked = await nodeVmRunner().run("typeof process");
  if (leaked.ok) expect(leaked.value).toBe("undefined");
});

test("nodeVmRunner reports a thrown error instead of propagating it", async () => {
  const r = await nodeVmRunner().run("throw new Error('boom')");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain("boom");
});

test("nodeVmRunner awaits a returned promise", async () => {
  const r = await nodeVmRunner().run("Promise.resolve(7)");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(7);
});

// ── remoteRunner (proxy; tested with an injected fetch) ──────────────────────────────────────────────────
test("remoteRunner posts the code and returns the service's result", async () => {
  let captured: unknown;
  const fakeFetch = (async (_url: string, init?: { body?: string }) => {
    captured = JSON.parse(init?.body ?? "{}");
    return new Response(JSON.stringify({ ok: true, value: 42, logs: ["ran"] }), { status: 200 });
  }) as unknown as typeof fetch;

  const runner = remoteRunner({ endpoint: "https://sandbox.test/run", fetch: fakeFetch });
  const r = await runner.run("return 42", { timeoutMs: 500 });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);
  expect(r.logs).toEqual(["ran"]);
  expect((captured as { code: string }).code).toBe("return 42");
});

test("remoteRunner surfaces an HTTP error as a failed result", async () => {
  const fakeFetch = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
  const r = await remoteRunner({ endpoint: "https://sandbox.test/run", fetch: fakeFetch }).run("x");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain("500");
});
