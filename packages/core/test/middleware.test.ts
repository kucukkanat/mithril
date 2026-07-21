import { expect, test } from "bun:test";
import type { EventConsumer, Middleware, MithrilEvent, Provider, ProviderChunk, ProviderSpec, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, plugin, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function turns(): ProviderChunk[][] {
  return [
    [{ type: "tool.call", callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "ok" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
}

test("tool middleware can short-circuit a call without executing it", async () => {
  let ran = false;
  const search = tool({
    name: "search",
    description: "",
    inputSchema: schema<{ q: string }>(),
    execute: async () => {
      ran = true;
      return { hits: [] };
    },
  });
  const guardrail: Middleware = {
    name: "guardrail",
    tool: async (ctx, call, next) => {
      if (call.name === "search") {
        ctx.emit({ type: "custom.guardrail.blocked", payload: { call: call.name } });
        return { callId: call.callId, status: "error", error: { name: "Blocked", message: "policy" } };
      }
      return next(call);
    },
  };
  const a = agent({ model: testModel(scriptedProvider(turns())), instructions: "x", tools: [search], use: [guardrail] });
  const res = await a.run("go");
  expect(res.status).toBe("completed");
  expect(ran).toBe(false); // the middleware blocked it — execute never ran
});

test("a plugin bundles a tool + a consumer that sees events", async () => {
  const seen: string[] = [];
  const logger: EventConsumer = { name: "logger", onEvent: (e: MithrilEvent) => seen.push(e.type) };
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const searchPlugin = plugin({ name: "search-plugin", tools: [search], consumers: [logger] });

  const a = agent({ model: testModel(scriptedProvider(turns())), instructions: "x", use: [searchPlugin] });
  const res = await a.run("go");
  expect(res.status).toBe("completed");
  expect(seen).toContain("run.start"); // consumer received events
  expect(seen).toContain("tool.result"); // the plugin's tool ran (came from the plugin, not inline tools)
});

test("model middleware can short-circuit the model call (cache)", async () => {
  let providerCalls = 0;
  const spec: ProviderSpec = { id: "count", models: {} };
  const countingProvider: Provider = {
    spec,
    async *chat() {
      providerCalls++;
      yield { type: "text.delta", delta: "live" };
      yield { type: "message.end", usage: NO_USAGE, finishReason: "stop" };
    },
  };
  const cache: Middleware = {
    name: "cache",
    model: async (_ctx, _call, _next) => ({ text: "cached", finishReason: "stop", usage: NO_USAGE, calls: [] }),
  };
  const a = agent({ model: { id: "count/x", provider: countingProvider }, instructions: "x", use: [cache] });
  const res = await a.run("go");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("cached");
  expect(providerCalls).toBe(0); // the provider was never called — middleware served the result
});

test("middleware composes outermost-first", async () => {
  const order: string[] = [];
  const mw = (name: string): Middleware => ({
    name,
    tool: async (_ctx, call, next) => {
      order.push(`>${name}`);
      const r = await next(call);
      order.push(`<${name}`);
      return r;
    },
  });
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const a = agent({ model: testModel(scriptedProvider(turns())), instructions: "x", tools: [search], use: [mw("A"), mw("B")] });
  await a.run("go");
  expect(order).toEqual([">A", ">B", "<B", "<A"]); // A wraps B (outermost first)
});
