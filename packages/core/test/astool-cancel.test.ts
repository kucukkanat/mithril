import { expect, test } from "bun:test";
import type { Provider, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, asTool, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

/*
 * Cancelling a parent must stop the work it delegated.
 *
 * A sub-agent runs its own loop with its own provider stream. If the parent's AbortSignal never reaches
 * the child, `cancel()` returns while the child keeps streaming and its HTTP request stays open — the run
 * reports "cancelled" but the work is still burning tokens. These pin the signal to the child.
 */

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

const delegateThenAnswer: (readonly ProviderChunk[])[] = [
  [{ type: "tool.call", callId: "c1", name: "delegate", input: { task: "do it" } }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
  [{ type: "text.delta", delta: "done" }, { type: "message.end", usage: NO, finishReason: "stop" }],
];

test("the parent's abort signal reaches the sub-agent's provider", async () => {
  let childSignal: AbortSignal | undefined;
  const childProvider: Provider = {
    spec: { id: "test", models: {} },
    async *chat(_req, _rt, _transport, signal) {
      childSignal = signal;
      yield { type: "text.delta", delta: "child done" };
      yield { type: "message.end", usage: NO, finishReason: "stop" };
    },
  };
  const child = agent({ model: testModel(childProvider), instructions: "child", tools: [] });
  const parent = agent({
    model: testModel(scriptedProvider(delegateThenAnswer)),
    instructions: "parent",
    tools: [asTool(child, { name: "delegate", description: "delegate" })],
  });

  const ctrl = new AbortController();
  await parent.run("go", { deps: undefined, signal: ctrl.signal });

  expect(childSignal).toBeDefined();
  // Not merely present — linked, so aborting the parent aborts the child mid-stream.
  ctrl.abort();
  expect(childSignal?.aborted).toBe(true);
});

test("a sub-agent already streaming is aborted when the parent is cancelled", async () => {
  let childSawAbort = false;
  const childProvider: Provider = {
    spec: { id: "test", models: {} },
    async *chat(_req, _rt, _transport, signal) {
      // Abort arrives while the child is mid-stream; a linked signal flips before the next token.
      await new Promise<void>((r) => setTimeout(r, 5));
      childSawAbort = signal.aborted;
      yield { type: "text.delta", delta: "child" };
      yield { type: "message.end", usage: NO, finishReason: "stop" };
    },
  };
  const child = agent({ model: testModel(childProvider), instructions: "child", tools: [] });
  const parent = agent({
    model: testModel(scriptedProvider(delegateThenAnswer)),
    instructions: "parent",
    tools: [asTool(child, { name: "delegate", description: "delegate" })],
  });

  const ctrl = new AbortController();
  const p = parent.run("go", { deps: undefined, signal: ctrl.signal });
  setTimeout(() => ctrl.abort(), 1);
  const res = await p;

  expect(res.status).toBe("cancelled");
  expect(childSawAbort).toBe(true);
});

test("a tool's ctx.signal is aborted when the run is cancelled", async () => {
  let toolSawAbort = false;
  const slow = tool({
    name: "delegate",
    description: "slow",
    inputSchema: schema<{ task: string }>(),
    execute: async (_in, ctx) => {
      await new Promise<void>((r) => setTimeout(r, 5));
      toolSawAbort = ctx.signal.aborted;
      return { ok: true };
    },
  });
  const a = agent({ model: testModel(scriptedProvider(delegateThenAnswer)), instructions: "p", tools: [slow] });
  const ctrl = new AbortController();
  const p = a.run("go", { deps: undefined, signal: ctrl.signal });
  setTimeout(() => ctrl.abort(), 1);
  await p;
  expect(toolSawAbort).toBe(true);
});
