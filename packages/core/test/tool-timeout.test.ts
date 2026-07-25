import { expect, test } from "bun:test";
import type { AnyTool, MithrilEvent, StandardSchemaV1 } from "../src/protocol/index.ts";
import { toolErrorClass } from "../src/protocol/index.ts";
import { agent, MithrilError, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// One tool call, then a text turn — so a failed tool still lets the run complete and we can read the error
// off the stream rather than off a thrown exception.
async function runWith(t: AnyTool<unknown>): Promise<{ events: readonly MithrilEvent[]; status: string }> {
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn(t.name, {}), textTurn("done")])),
    instructions: "help",
    tools: [t],
  });
  const events: MithrilEvent[] = [];
  const h = a.stream("go");
  for await (const e of h) events.push(e);
  return { events, status: (await h.result()).status };
}

function toolError(events: readonly MithrilEvent[]): MithrilEvent & { type: "tool.error" } {
  const e = events.find((x): x is MithrilEvent & { type: "tool.error" } => x.type === "tool.error");
  if (e === undefined) throw new Error(`no tool.error in stream: ${events.map((x) => x.type).join(", ")}`);
  return e;
}

test("a tool that exceeds timeoutMs fails with a timeout-classified error", async () => {
  const slow = tool({
    name: "slow",
    description: "sleeps past its budget",
    inputSchema: schema<Record<string, never>>(),
    timeoutMs: 30,
    execute: async () => {
      await sleep(400);
      return "never";
    },
  });
  const { events, status } = await runWith(slow);
  expect(status).toBe("completed"); // a timeout is a model-visible tool error, not a run failure
  expect(toolErrorClass(toolError(events).error)).toBe("timeout");
  expect(toolError(events).error.message).toContain("30ms");
});

test("a tool within its budget is unaffected", async () => {
  const quick = tool({
    name: "quick",
    description: "finishes in time",
    inputSchema: schema<Record<string, never>>(),
    timeoutMs: 500,
    execute: async () => {
      await sleep(5);
      return "ok";
    },
  });
  const { events, status } = await runWith(quick);
  expect(status).toBe("completed");
  expect(events.some((e) => e.type === "tool.error")).toBe(false);
  const result = events.find((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result");
  expect(result?.output).toBe("ok");
});

test("a tool without timeoutMs is not bounded", async () => {
  const unbounded = tool({
    name: "unbounded",
    description: "slow but has no declared budget",
    inputSchema: schema<Record<string, never>>(),
    execute: async () => {
      await sleep(80);
      return "ok";
    },
  });
  const { events, status } = await runWith(unbounded);
  expect(status).toBe("completed");
  expect(events.some((e) => e.type === "tool.error")).toBe(false);
});

test("ctx.signal aborts when the budget expires, so a tool can unwind cooperatively", async () => {
  let captured: AbortSignal | undefined;
  const cooperative = tool({
    name: "cooperative",
    description: "observes ctx.signal",
    inputSchema: schema<Record<string, never>>(),
    timeoutMs: 30,
    execute: async (_input, ctx) => {
      captured = ctx.signal;
      await sleep(400);
      return "never";
    },
  });
  const { events } = await runWith(cooperative);
  expect(toolErrorClass(toolError(events).error)).toBe("timeout");
  expect(captured?.aborted).toBe(true);
  const reason: unknown = captured?.reason;
  expect(reason).toBeInstanceOf(MithrilError);
  expect((reason as MithrilError).code).toBe("TOOL_TIMEOUT");
});

test("the run's own cancellation still reaches a timed tool's ctx.signal", async () => {
  let captured: AbortSignal | undefined;
  let entered: (() => void) | undefined;
  const gate = new Promise<void>((r) => {
    entered = r;
  });
  const waiting = tool({
    name: "waiting",
    description: "generous budget, cancelled from outside",
    inputSchema: schema<Record<string, never>>(),
    timeoutMs: 10_000, // far beyond the test — the abort must come from the run, not the budget
    execute: async (_input, ctx) => {
      captured = ctx.signal;
      entered?.();
      await sleep(400);
      return "never";
    },
  });
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("waiting", {}), textTurn("done")])),
    instructions: "help",
    tools: [waiting],
  });
  const h = a.stream("go");
  const drain = (async () => {
    for await (const _e of h) void _e;
  })();
  await gate;
  h.cancel("user stopped");
  await drain;
  expect((await h.result()).status).toBe("cancelled");
  expect(captured?.aborted).toBe(true);
});
