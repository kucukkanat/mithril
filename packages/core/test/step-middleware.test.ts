import { expect, test } from "bun:test";
import type { Middleware, Provider, StandardSchemaV1, StepOutcome, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function toolThenText() {
  const weather = tool({
    name: "weather",
    description: "",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => ({ city, temp: 20 }),
  });
  const model = testModel(
    scriptedProvider([
      [{ type: "tool.call", callId: "c1", name: "weather", input: { city: "NYC" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
      [{ type: "text.delta", delta: "sunny" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
    ]),
  );
  return { model, weather };
}

test("step middleware wraps each step and observes its outcome in order", async () => {
  const { model, weather } = toolThenText();
  const seen: StepOutcome[] = [];
  const observer: Middleware = {
    name: "observer",
    async step(ctx, input, next) {
      ctx.emit({ type: "custom.step.enter", payload: { step: input.step } });
      const out = await next(input);
      seen.push(out);
      return out;
    },
  };
  const a = agent({ model, instructions: "help", tools: [weather], use: [observer] });
  const r = await a.run("weather?");
  expect(r.status).toBe("completed");
  expect(seen.map((s) => [s.step, s.stop])).toEqual([
    [0, "tool"],
    [1, "text"],
  ]);
});

test("a step-budget middleware can end a run by aborting a shared signal", async () => {
  // A model that never stops calling a tool — only the budget can end the loop.
  const looping: Provider = {
    spec: { id: "test", models: {} },
    async *chat() {
      yield { type: "tool.call", callId: "c1", name: "noop", input: {} };
      yield { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" };
    },
  };
  const noop = tool({ name: "noop", description: "", inputSchema: schema<Record<string, never>>(), execute: async () => ({ ok: true }) });

  const ctrl = new AbortController();
  let steps = 0;
  const budget: Middleware = {
    name: "budget",
    async step(ctx, input, next) {
      if (steps >= 2) {
        ctrl.abort(); // short-circuit AND end the run via its signal
        return { step: input.step, stop: "text", usage: NO_USAGE };
      }
      steps++;
      return next(input);
    },
  };
  const a = agent({ model: testModel(looping), instructions: "loop", tools: [noop], use: [budget], maxSteps: 16 });
  const r = await a.run("go", { deps: undefined, signal: ctrl.signal });
  expect(r.status).toBe("cancelled");
  if (r.status === "cancelled") expect(r.usage.steps).toBe(2); // only the two budgeted steps called the model
});

test("step middleware runs OUTSIDE model/tool altitudes (widest wrap first)", async () => {
  const { model, weather } = toolThenText();
  const order: string[] = [];
  const mw: Middleware = {
    name: "orders",
    async step(_ctx, input, next) {
      order.push(`step:before:${input.step}`);
      const r = await next(input);
      order.push(`step:after:${input.step}`);
      return r;
    },
    async model(_ctx, call, next) {
      order.push("model");
      return next(call);
    },
    async tool(_ctx, call, next) {
      order.push("tool");
      return next(call);
    },
  };
  await agent({ model, instructions: "help", tools: [weather], use: [mw] }).run("weather?");
  // step 0: step wraps model + tool; step 1: step wraps model only (text answer)
  expect(order).toEqual([
    "step:before:0",
    "model",
    "tool",
    "step:after:0",
    "step:before:1",
    "model",
    "step:after:1",
  ]);
});
