import { expect, test } from "bun:test";
import type { JsonValue, MithrilEvent, Provider, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agentLoop, tool } from "../src/agent/index.ts";
import { testModel } from "../src/testkit/index.ts";

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────
function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
function usage(output: number, costMicroUsd = 0): UsageDelta {
  return { input: 0, output, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd };
}
// A provider that calls `name` every turn; `argsFor(turn)` shapes the arguments per turn (identical args
// exercise loop detection; varying args exercise budgets). Reports `perTurn` usage on each message.end.
function spinningTool(name: string, argsFor: (turn: number) => JsonValue, perTurn: UsageDelta): Provider {
  let turn = 0;
  return {
    spec: { id: "test", models: {} },
    async *chat() {
      turn += 1;
      yield { type: "tool.call", callId: `c${turn}`, name, input: argsFor(turn) };
      yield { type: "message.end", usage: perTurn, finishReason: "tool_calls" };
    },
  };
}
async function collect<R>(gen: AsyncGenerator<MithrilEvent, R>): Promise<{ readonly events: readonly MithrilEvent[]; readonly result: R }> {
  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) return { events, result: r.value };
    events.push(r.value);
  }
}

// ── loop / no-progress detection ────────────────────────────────────────────────────────────────

test("identical successful calls are steered once, then halted with a typed LoopDetected error", async () => {
  const ping = tool({ name: "ping", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => ({ pong: true }) });
  const { events, result } = await collect(
    agentLoop({ model: testModel(spinningTool("ping", () => ({}), usage(1))), instructions: "hi", tools: [ping], input: "go", deps: undefined }),
  );
  const detects = events.filter((e) => e.type === "loop.detected");
  expect(detects.map((e) => (e.type === "loop.detected" ? e.action : ""))).toEqual(["steer", "halt"]);
  expect(result.status).toBe("error");
  if (result.status === "error") expect(result.error.name).toBe("LoopDetected");
});

test("loopDetection: false lets the run proceed to the maxSteps budget instead", async () => {
  const ping = tool({ name: "ping", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => ({ pong: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(spinningTool("ping", () => ({}), usage(1))),
      instructions: "hi",
      tools: [ping],
      input: "go",
      deps: undefined,
      loopDetection: false,
      maxSteps: 5,
    }),
  );
  expect(events.some((e) => e.type === "loop.detected")).toBe(false);
  expect(result.status).toBe("error");
  if (result.status === "error") expect(result.error.name).toBe("MaxStepsExceeded");
});

// ── token / cost budgets ─────────────────────────────────────────────────────────────────────────

test("maxTokens ends the run with a budget.exceeded event and a typed terminal error", async () => {
  const work = tool({ name: "work", description: "", inputSchema: passSchema<{ i: number }>(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({
      // distinct args each turn so loop detection stays out of it; 100 output tokens per turn
      model: testModel(spinningTool("work", (t) => ({ i: t }), usage(100))),
      instructions: "hi",
      tools: [work],
      input: "go",
      deps: undefined,
      maxTokens: 150,
    }),
  );
  const budget = events.find((e) => e.type === "budget.exceeded");
  expect(budget?.type).toBe("budget.exceeded");
  if (budget?.type === "budget.exceeded") {
    expect(budget.budget).toBe("tokens");
    expect(budget.actual).toBeGreaterThan(150);
  }
  expect(result.status).toBe("error");
  if (result.status === "error") expect(result.error.name).toBe("BudgetExceeded");
});

test("maxCostMicroUsd ends the run when accumulated cost passes the limit", async () => {
  const work = tool({ name: "work", description: "", inputSchema: passSchema<{ i: number }>(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(spinningTool("work", (t) => ({ i: t }), usage(1, 500))), // 500 micro-USD/turn
      instructions: "hi",
      tools: [work],
      input: "go",
      deps: undefined,
      maxCostMicroUsd: 900,
    }),
  );
  const budget = events.find((e) => e.type === "budget.exceeded");
  expect(budget?.type === "budget.exceeded" && budget.budget).toBe("cost");
  expect(result.status).toBe("error");
});
