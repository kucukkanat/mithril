import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { MithrilEvent, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { type GenAiSpan, toGenAiSpans } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

test("folds a run's events into a gen_ai span tree (invoke_agent > chat > execute_tool)", async () => {
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const turns = [
    [{ type: "tool.call" as const, callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "tool_calls" as const }],
    [{ type: "text.delta" as const, delta: "ok" }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "stop" as const }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [search] });

  const log: MithrilEvent[] = [];
  for await (const e of a.stream("go")) log.push(e);

  const closed: GenAiSpan[] = [];
  const spans = toGenAiSpans(log, { onSpan: (s) => closed.push(s) });

  const root = spans.find((s) => s.kind === "invoke_agent");
  const toolSpan = spans.find((s) => s.kind === "execute_tool");
  expect(root).toBeDefined();
  expect(toolSpan?.name).toBe("execute_tool search");
  expect(toolSpan?.parentSpanId).not.toBeNull();
  // execute_tool spans nest under a chat span, chat under invoke_agent
  expect(closed.some((s) => s.kind === "execute_tool" && s.endTime !== undefined)).toBe(true);
});

test("otelPlugin emits spans to the sink when a run completes, via the use: seam", async () => {
  const { otelPlugin } = await import("../src/index.ts");
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const turns = [
    [{ type: "tool.call" as const, callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "tool_calls" as const }],
    [{ type: "text.delta" as const, delta: "ok" }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "stop" as const }],
  ];
  const spans: GenAiSpan[] = [];
  const a = agent({
    model: testModel(scriptedProvider(turns)),
    instructions: "x",
    tools: [search],
    use: [otelPlugin({ onSpan: (s) => spans.push(s) })],
  });
  const r = await a.run("go");
  expect(r.status).toBe("completed");
  expect(spans.some((s) => s.kind === "invoke_agent")).toBe(true);
  expect(spans.some((s) => s.name === "execute_tool search")).toBe(true);
});
