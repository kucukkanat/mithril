import { expect, test } from "bun:test";
import type { MithrilEvent, SpanRef, StandardSchemaV1 } from "../src/protocol/index.ts";
import { narrow } from "../src/protocol/index.ts";
import { tool } from "../src/agent/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

const search = tool({
  name: "search",
  description: "",
  inputSchema: schema<{ query: string }>(),
  execute: async () => "",
});
const tools = [search] as const;

const SP: SpanRef = { id: "s", parentId: null, traceId: "t", kind: "chat" };
const call: MithrilEvent = {
  v: 1,
  runId: "r",
  seq: 0,
  ts: 0,
  span: SP,
  type: "tool.call",
  callId: "c",
  name: "search",
  input: { query: "x" },
};

test("narrow is true for a matching tool.call", () => {
  expect(narrow(call, tools)).toBe(true);
  if (narrow(call, tools)) {
    // name-correlated narrowing at runtime + type level
    expect(call.name).toBe("search");
  }
});

test("narrow is false for a non-tool.call event", () => {
  const text: MithrilEvent = { v: 1, runId: "r", seq: 1, ts: 0, span: SP, type: "text.delta", delta: "a" };
  expect(narrow(text, tools)).toBe(false);
});

test("narrow is false for an unknown tool name", () => {
  const other: MithrilEvent = { ...call, name: "other" };
  expect(narrow(other, tools)).toBe(false);
});
