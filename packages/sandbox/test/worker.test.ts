import { expect, test } from "bun:test";
import { workerRunner } from "../src/worker.ts";

// Parity with sandbox.test.ts's nodeVmRunner cases, plus the one case node:vm cannot pass.

test("workerRunner evaluates an expression and returns its value", async () => {
  const r = await workerRunner().run("(() => { const a = 2; return a * 21; })()");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);
});

test("workerRunner captures console output", async () => {
  const r = await workerRunner().run("(() => { console.log('hello', 1); return 0; })()");
  expect(r.ok).toBe(true);
  expect(r.logs).toEqual(["hello 1"]);
});

test("workerRunner injects globals and isolates the host scope", async () => {
  const r = await workerRunner().run("input.x + 1", { globals: { input: { x: 41 } } });
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(42);

  // A host binding must not be visible inside the worker.
  const leaked = await workerRunner().run("typeof expect");
  expect(leaked.ok).toBe(true);
  if (leaked.ok) expect(leaked.value).toBe("undefined");
});

test("workerRunner reports a thrown error instead of propagating it", async () => {
  const r = await workerRunner().run("(() => { throw new Error('boom'); })()");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain("boom");
});

test("workerRunner awaits a returned promise", async () => {
  const r = await workerRunner().run("Promise.resolve(7)");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe(7);
});

test("the network globals are removed, so the default really is a closed world", async () => {
  // This is the mechanical answer to "what stops an authored tool exfiltrating?" — no channel, not a policy.
  const r = await workerRunner().run("[typeof fetch, typeof XMLHttpRequest, typeof WebSocket].join(',')");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBe("undefined,undefined,undefined");
});

test("an async body that never settles is bounded — the case node:vm cannot bound", async () => {
  // node:vm's `timeout` covers synchronous execution only; terminate() is what makes this enforceable.
  const started = Date.now();
  const r = await workerRunner().run("new Promise(() => {})", { timeoutMs: 150 });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain("150ms");
  expect(Date.now() - started).toBeLessThan(3000);
});

test("a synchronous infinite loop is bounded too", async () => {
  const r = await workerRunner().run("while (true) {}", { timeoutMs: 150 });
  expect(r.ok).toBe(false);
});

test("defaultTimeoutMs applies when a call passes none", async () => {
  const r = await workerRunner({ defaultTimeoutMs: 120 }).run("new Promise(() => {})");
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error).toContain("120ms");
});

test("workerRunner declares scope isolation, not remote", async () => {
  // Machine-readable so a caller can refuse local execution without pattern-matching on the factory.
  expect(workerRunner().isolation).toBe("scope");
});

test("undefined comes back as null, keeping results JSON-safe", async () => {
  const r = await workerRunner().run("undefined");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value).toBeNull();
});
