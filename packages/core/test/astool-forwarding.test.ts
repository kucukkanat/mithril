import { expect, test } from "bun:test";
import type { Provider, ProviderRegistry, RuntimeAdapter, StandardSchemaV1, Transport, UsageDelta } from "../src/protocol/index.ts";
import { agent, asTool, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// Parent turn: call `delegate` (the asTool wrapper), then answer.
function delegateThenAnswer(answer: string): (readonly import("../src/protocol/index.ts").ProviderChunk[])[] {
  return [
    [{ type: "tool.call", callId: "c1", name: "delegate", input: { task: "do it" } }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: answer }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
}

test("asTool forwards the parent's transport and runtime to the sub-agent automatically", async () => {
  const seen: { transport?: Transport; runtime?: RuntimeAdapter } = {};
  // Child provider records the transport + runtime it is invoked with, then answers.
  const childProvider: Provider = {
    spec: { id: "test", models: {} },
    async *chat(_req, rt, transport) {
      seen.transport = transport;
      seen.runtime = rt;
      yield { type: "text.delta", delta: "child done" };
      yield { type: "message.end", usage: NO, finishReason: "stop" };
    },
  };
  const child = agent({ model: testModel(childProvider), instructions: "child", tools: [] });
  const parent = agent({
    model: testModel(scriptedProvider(delegateThenAnswer("all done"))),
    instructions: "parent",
    tools: [asTool(child, { name: "delegate", description: "delegate" })],
  });

  const parentTransport: Transport = { kind: "byok", apiKey: "SECRET-PARENT-KEY", baseUrl: "https://example.test/v1" };
  const parentRuntime: RuntimeAdapter = {
    fetch: (() => {
      throw new Error("unused");
    }) as unknown as typeof fetch,
    now: () => 42,
    randomUUID: () => "11111111-1111-4111-8111-111111111111",
    getRandomValues: ((a: unknown) => a) as RuntimeAdapter["getRandomValues"],
  };

  const result = await parent.run("go", { transport: parentTransport, runtime: parentRuntime });
  expect(result.status).toBe("completed");
  // The child inherited the parent's exact transport (key + baseUrl) with no re-wiring.
  expect(seen.transport).toEqual(parentTransport);
  // And the parent's custom runtime (its deterministic clock proves identity).
  expect(seen.runtime?.now()).toBe(42);
});

test("asTool forwards the parent's providers registry so a bare-string sub-agent model resolves", async () => {
  const childProvider: Provider = {
    spec: { id: "acme", models: {} },
    async *chat() {
      yield { type: "text.delta", delta: "resolved" };
      yield { type: "message.end", usage: NO, finishReason: "stop" };
    },
  };
  const registry: ProviderRegistry = { resolve: () => childProvider, specs: [childProvider.spec] };
  // Child uses a BARE STRING model — it can only resolve via a providers registry, which asTool must forward.
  const child = agent({ model: "acme/model-x", instructions: "child", tools: [] });
  const parent = agent({
    model: testModel(scriptedProvider(delegateThenAnswer("all done"))),
    instructions: "parent",
    tools: [asTool(child, { name: "delegate", description: "delegate" })],
  });

  // The parent supplies the registry; without forwarding, the child would throw NO_PROVIDER.
  const result = await parent.run("go", { providers: registry });
  expect(result.status).toBe("completed");
});

test("the parent run's own transport is exposed on the tool RunContext", async () => {
  let ctxTransport: Transport | undefined;
  const peek = tool({
    name: "peek",
    description: "",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_input, ctx) => {
      ctxTransport = ctx.transport;
      return { ok: true };
    },
  });
  const a = agent({
    model: testModel(
      scriptedProvider([
        [{ type: "tool.call", callId: "c1", name: "peek", input: {} }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
        [{ type: "text.delta", delta: "done" }, { type: "message.end", usage: NO, finishReason: "stop" }],
      ]),
    ),
    instructions: "hi",
    tools: [peek],
  });
  const transport: Transport = { kind: "byok", apiKey: "K" };
  await a.run("go", { transport });
  expect(ctxTransport).toEqual(transport);
});
