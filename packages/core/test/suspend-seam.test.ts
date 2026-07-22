import { expect, test } from "bun:test";
import type { MithrilEvent, ProviderChunk, StandardSchemaV1, Suspend, UsageDelta } from "../src/protocol/index.ts";
import { suspend } from "../src/protocol/index.ts";
import { agent, asTool, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A model that calls `toolName` on turn 0, then answers "done" on turn 1.
function callThenAnswer(toolName: string, input: Record<string, unknown> = {}): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: toolName, input },
      { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" },
    ],
    [
      { type: "text.delta", delta: "done" },
      { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
    ],
  ];
}

// ── Tier-1b: a tool returns suspend(...) ────────────────────────────────────────────────────────────────
test("Tier-1b: a tool that returns suspend() pauses, and the resolution becomes its result", async () => {
  let executions = 0;
  const ask = tool({
    name: "ask",
    description: "ask the user",
    inputSchema: schema<{ q: string }>(),
    execute: async ({ q }): Promise<string | Suspend<string>> => {
      executions++;
      return suspend({ kind: "user.input", payload: { q }, resolutionSchema: schema<string>(), resolutionSchemaId: "ui" });
    },
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("ask", { q: "name?" }))), instructions: "help", tools: [ask] });

  const r = await a.run("hi");
  expect(r.status).toBe("suspended");
  if (r.status !== "suspended") throw new Error("expected suspended");
  expect(r.request.kind).toBe("user.input");
  expect(r.request.payload).toEqual({ q: "name?" });

  const done = await a.resume(r.token, { kind: "resolve", value: "Ada" });
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("done");
  expect(executions).toBe(1); // Tier-1b does NOT re-run the tool
});

// ── Tier-2: ctx.suspend() mid-execute, with journaled exactly-once effects ───────────────────────────────
test("Tier-2: ctx.suspend() pauses mid-tool; journaled effects run exactly once across resume", async () => {
  let sideEffects = 0;
  const confirmTool = tool({
    name: "wf",
    description: "a workflow that confirms",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_input, ctx): Promise<{ a: number; approved: boolean }> => {
      const a = await ctx.journal("step-a", async () => {
        sideEffects++;
        return 10;
      });
      const approved = await ctx.suspend({ kind: "confirm", payload: { a }, resolutionSchema: schema<boolean>(), resolutionSchemaId: "c" });
      return { a, approved };
    },
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("wf"))), instructions: "help", tools: [confirmTool] });

  const r = await a.run("run it");
  expect(r.status).toBe("suspended");
  if (r.status !== "suspended") throw new Error("expected suspended");
  expect(r.request.kind).toBe("confirm");
  expect(r.request.payload).toEqual({ a: 10 });
  expect(sideEffects).toBe(1);

  const done = await a.resume(r.token, { kind: "resolve", value: true });
  expect(done.status).toBe("completed");
  expect(sideEffects).toBe(1); // journaled effect replayed from the log, not re-executed
});

test("Tier-2: a tool that suspends twice resolves each pause in order", async () => {
  const twice = tool({
    name: "wf",
    description: "suspends twice",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_input, ctx): Promise<{ x: string; y: string }> => {
      const x = await ctx.suspend({ kind: "q1", payload: {}, resolutionSchema: schema<string>(), resolutionSchemaId: "q" });
      const y = await ctx.suspend({ kind: "q2", payload: {}, resolutionSchema: schema<string>(), resolutionSchemaId: "q" });
      return { x, y };
    },
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("wf"))), instructions: "help", tools: [twice] });

  const r1 = await a.run("go");
  if (r1.status !== "suspended") throw new Error("expected first suspend");
  expect(r1.request.kind).toBe("q1");

  const r2 = await a.resume(r1.token, { kind: "resolve", value: "first" });
  if (r2.status !== "suspended") throw new Error("expected second suspend");
  expect(r2.request.kind).toBe("q2");

  const r3 = await a.resume(r2.token, { kind: "resolve", value: "second" });
  expect(r3.status).toBe("completed");
});

// ── resumeStream(): streaming resume ────────────────────────────────────────────────────────────────────────
test("resumeStream() resumes a suspension as a live streaming RunHandle", async () => {
  const ask = tool({
    name: "ask",
    description: "ask",
    inputSchema: schema<{ q: string }>(),
    execute: async ({ q }): Promise<string | Suspend<string>> =>
      suspend({ kind: "user.input", payload: { q }, resolutionSchema: schema<string>(), resolutionSchemaId: "ui" }),
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("ask", { q: "x" }))), instructions: "help", tools: [ask] });

  const r = await a.run("hi");
  if (r.status !== "suspended") throw new Error("expected suspended");

  const handle = a.resumeStream(r.token, { kind: "resolve", value: "y" });
  const events: MithrilEvent[] = [];
  for await (const e of handle.events) events.push(e);
  const done = await handle.result();
  expect(done.status).toBe("completed");
  expect(events.map((e) => e.type)).toContain("resume");
  expect(events.map((e) => e.type)).toContain("tool.result");
});

// ── in-process resolve() ─────────────────────────────────────────────────────────────────────────────────
test("RunHandle.resolve() continues an in-process suspension without a token round-trip", async () => {
  const ask = tool({
    name: "ask",
    description: "ask",
    inputSchema: schema<{ q: string }>(),
    execute: async ({ q }): Promise<string | Suspend<string>> =>
      suspend({ kind: "user.input", payload: { q }, resolutionSchema: schema<string>(), resolutionSchemaId: "ui" }),
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("ask", { q: "x" }))), instructions: "help", tools: [ask] });

  const first = a.stream("hi");
  const suspended = await first.result();
  expect(suspended.status).toBe("suspended");

  const resumed = await first.resolve({ kind: "resolve", value: "z" });
  const done = await resumed.result();
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("done");
});

test("resolve() rejects when the run did not suspend", async () => {
  const a = agent({
    model: testModel(
      scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]]),
    ),
    instructions: "help",
  });
  const h = a.stream("hi");
  await h.result();
  await expect(h.resolve({ kind: "resolve", value: 1 })).rejects.toThrow(/suspended/);
});

// ── asTool(): a sub-agent as a tool ──────────────────────────────────────────────────────────────────────
test("asTool() runs a sub-agent and returns its output as the tool result", async () => {
  const child = agent({
    model: testModel(
      scriptedProvider([[{ type: "text.delta", delta: "child-answer" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]]),
    ),
    instructions: "be the child",
  });
  const research = asTool(child, { name: "research", description: "delegate research" });
  const parent = agent({
    model: testModel(scriptedProvider(callThenAnswer("research", { task: "look into X" }))),
    instructions: "delegate",
    tools: [research],
  });

  const r = await parent.run("do research");
  expect(r.status).toBe("completed");
  if (r.status === "completed") expect(r.output).toBe("done");
});

// ── resolutionSchema is optional: a plain ctx.suspend({ kind, payload }) works ───────────────────────────
test("Tier-2: ctx.suspend needs no resolutionSchema — a bare { kind, payload } pauses and resumes", async () => {
  const confirm = tool({
    name: "confirm",
    description: "ask for confirmation",
    inputSchema: schema<{ a: number }>(),
    execute: async ({ a }, ctx) => {
      const ok = (await ctx.suspend({ kind: "confirm", payload: { a } })) as boolean;
      return { doubled: ok ? a * 2 : 0 };
    },
  });
  const a = agent({ model: testModel(scriptedProvider(callThenAnswer("confirm", { a: 21 }))), instructions: "x", tools: [confirm] });
  const r = await a.run("go");
  expect(r.status).toBe("suspended");
  if (r.status !== "suspended") return;
  expect(r.request.kind).toBe("confirm");
  expect(r.request.resolutionSchemaId).toBeUndefined(); // no schema ceremony
  const done = await a.resume(r.token, { kind: "resolve", value: true });
  expect(done.status).toBe("completed");
});
