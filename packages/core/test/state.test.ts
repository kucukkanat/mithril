import { describe, expect, test } from "bun:test";
import type { EventMeta, MithrilEvent, SpanRef, UsageDelta, UsageTotals } from "../src/protocol/index.ts";
import { INITIAL, reduce, replay } from "../src/protocol/index.ts";

const ROOT: SpanRef = { id: "root", parentId: null, traceId: "t", kind: "invoke_agent" };
const STEP: SpanRef = { id: "step1", parentId: "root", traceId: "t", kind: "chat" };
const SUB: SpanRef = { id: "sub", parentId: "root", traceId: "t", kind: "invoke_agent" };

function meta(seq: number, span: SpanRef = ROOT): EventMeta {
  return { v: 1, runId: "r1", seq, ts: seq, span };
}
const u = (n: number): UsageDelta => ({
  input: n,
  output: n,
  cacheRead: 0,
  cacheWrite: 0,
  reasoning: 0,
  costMicroUsd: n,
});
const totals = (n: number, steps: number): UsageTotals => ({ ...u(n), steps });

describe("reduce / replay", () => {
  const happy: MithrilEvent[] = [
    { ...meta(0), type: "run.start", input: "hello", model: "anthropic/x", depsDigest: "" },
    { ...meta(1, STEP), type: "step.start", step: 0 },
    { ...meta(2, STEP), type: "text.delta", delta: "Hi " },
    { ...meta(3, STEP), type: "text.delta", delta: "there" },
    { ...meta(4, STEP), type: "tool.call", callId: "c1", name: "search", input: { q: "x" } },
    { ...meta(5, STEP), type: "tool.result", callId: "c1", output: { hits: 1 }, ms: 10 },
    { ...meta(6, STEP), type: "usage", delta: u(5) },
    { ...meta(7), type: "run.finish", reason: "stop", usage: totals(5, 1) },
  ];

  test("folds a full run to completion", () => {
    const s = replay(happy);
    expect(s.status).toBe("completed");
    expect(s.runId).toBe("r1");
    expect(s.cursor).toBe(7);
    // user 'hello' + one assistant turn
    expect(s.messages.length).toBe(2);
    expect(s.messages[0]).toEqual({ role: "user", content: "hello", toolCalls: [] });
    expect(s.messages[1]?.content).toBe("Hi there");
    expect(s.messages[1]?.toolCalls[0]?.output).toEqual({ hits: 1 });
    expect(s.usage.input).toBe(5);
  });

  test("is total — an unknown/custom event is inert", () => {
    const started = replay(happy.slice(0, 1));
    const after = reduce(started, { ...meta(1), type: "custom.telemetry", payload: { a: 1 } });
    expect(after.status).toBe("running"); // unchanged
    expect(after.messages).toEqual(started.messages);
    expect(after.cursor).toBe(1); // cursor still advances
  });

  test("suspend sets pending; resume clears it", () => {
    const s = replay([
      { ...meta(0), type: "run.start", input: "x", model: "m/x", depsDigest: "" },
      {
        ...meta(1, STEP),
        type: "suspend",
        descriptor: { kind: "tool.approval", payload: {}, resolutionSchemaId: "id" },
      },
    ]);
    expect(s.status).toBe("suspended");
    expect(s.pending?.kind).toBe("tool.approval");
    const resumed = reduce(s, { ...meta(2, STEP), type: "resume", resolutionFor: "id", value: {} });
    expect(resumed.status).toBe("running");
    expect(resumed.pending).toBeUndefined();
  });

  test("sub-run events do NOT corrupt root state (span routing)", () => {
    const s = replay([
      { ...meta(0), type: "run.start", input: "x", model: "m/x", depsDigest: "" },
      { ...meta(1, SUB), type: "run.start", input: "y", model: "m/x", depsDigest: "" },
      { ...meta(2, SUB), type: "usage", delta: u(3) },
    ]);
    expect(s.usage.input).toBe(0); // root untouched
    expect(s.subruns?.["sub"]?.usage.input).toBe(3); // accrued to the sub-run
  });

  test("time-travel: replay to a cursor", () => {
    const partial = replay(happy, 3); // before the tool.call at seq 4
    expect(partial.status).toBe("running");
    expect(partial.messages[1]?.content).toBe("Hi there");
    expect(partial.messages[1]?.toolCalls.length).toBe(0);
  });

  test("INITIAL is the empty run", () => {
    expect(INITIAL.status).toBe("running");
    expect(INITIAL.messages).toEqual([]);
    expect(INITIAL.cursor).toBe(-1);
  });
});

describe("call ids that repeat across steps", () => {
  // Several providers mint ids from a per-request counter (google's `call_N`, the local provider's
  // fallback), so step 2 legitimately reuses step 1's ids. Each result must bind to its OWN call.
  const log: MithrilEvent[] = [
    { ...meta(0), type: "run.start", input: "go", model: "google/gemini", depsDigest: "" },
    { ...meta(1, STEP), type: "step.start", step: 0 },
    { ...meta(2, STEP), type: "tool.call", callId: "call_1", name: "weather", input: { city: "NYC" } },
    { ...meta(3, STEP), type: "tool.result", callId: "call_1", output: { tempC: 21 }, ms: 1 },
    { ...meta(4, STEP), type: "step.start", step: 1 },
    { ...meta(5, STEP), type: "tool.call", callId: "call_1", name: "weather", input: { city: "Paris" } },
    { ...meta(6, STEP), type: "tool.result", callId: "call_1", output: { tempC: 14 }, ms: 1 },
  ];

  test("each result lands on the call it belongs to", () => {
    const calls = replay(log).messages.flatMap((m) => m.toolCalls);
    expect(calls.map((c) => c.input)).toEqual([{ city: "NYC" }, { city: "Paris" }]);
    expect(calls.map((c) => c.output)).toEqual([{ tempC: 21 }, { tempC: 14 }]);
  });

  test("a result for an unknown id is inert", () => {
    const before = replay(log);
    const after = reduce(before, { ...meta(7, STEP), type: "tool.result", callId: "nope", output: 1, ms: 1 });
    expect(after.messages).toEqual(before.messages);
  });
});
