import { expect, test } from "bun:test";
import type { EventMeta, MithrilEvent, SpanRef, ToolDefinition, UsageTotals } from "../src/protocol/index.ts";
import { isKnownEvent, replay, withDigest } from "../src/protocol/index.ts";

const ROOT: SpanRef = { id: "root", parentId: null, traceId: "t", kind: "invoke_agent" };
const STEP: SpanRef = { id: "step1", parentId: "root", traceId: "t", kind: "chat" };
const SUB: SpanRef = { id: "sub", parentId: "root", traceId: "t", kind: "invoke_agent" };

function meta(seq: number, span: SpanRef = ROOT): EventMeta {
  return { v: 1, runId: "r1", seq, ts: seq, span };
}
const NO_USAGE: UsageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0, steps: 0 };

function def(name: string, body: unknown = { kind: "composition" }): ToolDefinition {
  return withDigest({ name, description: `the ${name} tool`, inputSchema: { type: "object" }, body: body as never });
}

const registered = (seq: number, d: ToolDefinition, span: SpanRef = STEP): MithrilEvent => ({
  ...meta(seq, span),
  type: "tool.registered",
  name: d.name,
  provenance: { kind: "runtime", by: "define_tool", callId: "c1" },
  definition: d,
  callId: "c1",
});
const revoked = (seq: number, name: string, span: SpanRef = STEP): MithrilEvent => ({
  ...meta(seq, span),
  type: "tool.revoked",
  name,
  reason: "revoked",
});

test("both new events are known, so a consumer's default branch is unaffected", () => {
  expect(isKnownEvent(registered(0, def("x")))).toBe(true);
  expect(isKnownEvent(revoked(0, "x"))).toBe(true);
});

test("tool.registered folds the definition into RunState.tools", () => {
  const d = def("weather_f");
  const s = replay([{ ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" }, registered(1, d)]);
  expect(s.tools).toEqual({ weather_f: d });
});

test("RunState.tools is absent until the first registration, not an empty object", () => {
  // Absent rather than `{}` so existing deep-equality assertions on a tool-free run keep passing.
  const s = replay([{ ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" }]);
  expect(s.tools).toBeUndefined();
});

test("tool.revoked removes the definition, and revoking an absent tool is inert", () => {
  const s = replay([
    { ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" },
    registered(1, def("a")),
    registered(2, def("b")),
    revoked(3, "a"),
    revoked(4, "never-registered"),
  ]);
  expect(Object.keys(s.tools ?? {})).toEqual(["b"]);
});

test("a re-registration under the same name replaces the definition", () => {
  const second = def("x", { kind: "script" });
  const s = replay([
    { ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" },
    registered(1, def("x")),
    registered(2, second),
  ]);
  expect(s.tools).toEqual({ x: second });
});

test("replay to a cursor time-travels the registry", () => {
  const log: MithrilEvent[] = [
    { ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" },
    registered(1, def("a")),
    revoked(2, "a"),
  ];
  expect(replay(log, 0).tools).toBeUndefined();
  expect(Object.keys(replay(log, 1).tools ?? {})).toEqual(["a"]);
  expect(Object.keys(replay(log, 2).tools ?? {})).toEqual([]);
});

test("a tool registered inside a sub-run accrues to that sub-run, not root", () => {
  // The span-routing guarantee: an asTool child defining a tool must not leak it into the parent's state.
  const child = def("child_tool");
  const s = replay([
    { ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" },
    { ...meta(1, SUB), type: "run.start", input: "sub", model: "m", depsDigest: "" },
    registered(2, child, SUB),
    { ...meta(3, SUB), type: "run.finish", reason: "stop", usage: NO_USAGE },
  ]);
  expect(s.tools).toBeUndefined();
  expect(s.subruns?.["sub"]?.tools).toEqual({ child_tool: child });
});

test("the fold is immutable — the prior state's tools are untouched", () => {
  const log: MithrilEvent[] = [
    { ...meta(0), type: "run.start", input: "hi", model: "m", depsDigest: "" },
    registered(1, def("a")),
  ];
  const before = replay(log, 1);
  const after = replay([...log, revoked(2, "a")]);
  expect(Object.keys(before.tools ?? {})).toEqual(["a"]);
  expect(Object.keys(after.tools ?? {})).toEqual([]);
});
