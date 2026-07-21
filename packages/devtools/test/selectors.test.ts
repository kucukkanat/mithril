import { expect, test } from "bun:test";
import type { MithrilEvent, RunState, SpanRef, UsageTotals } from "@mithril/core/protocol";
import { buildSpanTree, classifyEvent, compactionSavings, contextMeter, previewEvent } from "../src/index.ts";

function span(id: string, parentId: string | null, kind: SpanRef["kind"] = "chat"): SpanRef {
  return { id, parentId, traceId: "t", kind };
}
let seq = 0;
function ev(type: string, sp: SpanRef, extra: Record<string, unknown> = {}): MithrilEvent {
  return { v: 1, runId: "r", seq: seq++, ts: 0, span: sp, type, ...extra } as MithrilEvent;
}

test("classifyEvent groups the event union into colour families", () => {
  expect(classifyEvent("run.start")).toBe("lifecycle");
  expect(classifyEvent("step.finish")).toBe("lifecycle");
  expect(classifyEvent("text.delta")).toBe("text");
  expect(classifyEvent("message.end")).toBe("text");
  expect(classifyEvent("tool.call")).toBe("tool");
  expect(classifyEvent("tool.result")).toBe("toolResult");
  expect(classifyEvent("tool.error")).toBe("error");
  expect(classifyEvent("object.final")).toBe("object");
  expect(classifyEvent("object.invalid")).toBe("error");
  expect(classifyEvent("suspend")).toBe("control");
  expect(classifyEvent("handoff.result")).toBe("control");
  expect(classifyEvent("usage")).toBe("meta");
  expect(classifyEvent("custom.telemetry")).toBe("custom");
});

test("previewEvent renders a compact per-event summary", () => {
  const s = span("a", null);
  expect(previewEvent(ev("tool.call", s, { name: "deploy", input: { env: "prod" } }))).toBe('deploy({"env":"prod"})');
  expect(previewEvent(ev("text.delta", s, { delta: "hello" }))).toBe("hello");
  expect(previewEvent(ev("message.end", s, { role: "assistant", usage: { input: 3, output: 7 } }))).toBe("assistant · 10 tok");
  expect(previewEvent(ev("object.final", s, { value: { ok: true } }))).toBe('{"ok":true}');
  expect(previewEvent(ev("suspend", s, { descriptor: { kind: "tool.approval" } }))).toBe("tool.approval");
});

test("buildSpanTree nests spans by parentId (a nested sub-run becomes a sub-tree)", () => {
  seq = 0;
  const root = span("root", null, "invoke_agent");
  const chat = span("chat", "root", "chat");
  const tool = span("tool", "chat", "execute_tool");
  const subRoot = span("sub", "tool", "invoke_agent"); // a nested asTool sub-run
  const events = [
    ev("run.start", root),
    ev("step.start", chat),
    ev("tool.call", tool, { name: "delegate", input: {} }),
    ev("run.start", subRoot),
    ev("run.finish", subRoot),
    ev("tool.result", tool, { output: {}, ms: 1 }),
    ev("run.finish", root),
  ];
  const roots = buildSpanTree(events);
  expect(roots).toHaveLength(1);
  expect(roots[0]?.span.id).toBe("root");
  expect(roots[0]?.children.map((c) => c.span.id)).toEqual(["chat"]);
  const chatNode = roots[0]?.children[0];
  expect(chatNode?.children.map((c) => c.span.id)).toEqual(["tool"]);
  const toolNode = chatNode?.children[0];
  expect(toolNode?.children.map((c) => c.span.id)).toEqual(["sub"]); // the nested sub-run
  expect(toolNode?.events.map((e) => e.type)).toEqual(["tool.call", "tool.result"]);
});

test("contextMeter projects usage; pct appears only with a contextWindow", () => {
  const usage: UsageTotals = { input: 100, output: 50, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 2_500, steps: 3 };
  const state = { runId: "r", status: "running", messages: [], usage, cursor: 5 } as RunState;
  const bare = contextMeter(state);
  expect(bare.tokens).toBe(150);
  expect(bare.cost).toBeCloseTo(0.0025, 6);
  expect(bare.steps).toBe(3);
  expect(bare.pct).toBeUndefined();
  const withWindow = contextMeter(state, { contextWindow: 1000 });
  expect(withWindow.pct).toBe(15);
});

test("compactionSavings sums savedTokens across compaction events", () => {
  seq = 0;
  const s = span("a", null);
  const events = [
    ev("compaction", s, { removedSeqRange: [1, 4], summarySeq: 5, savedTokens: 200 }),
    ev("text.delta", s, { delta: "x" }),
    ev("compaction", s, { removedSeqRange: [6, 9], summarySeq: 10, savedTokens: 300 }),
  ];
  expect(compactionSavings(events)).toBe(500);
});
