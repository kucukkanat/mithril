import { expect, test } from "bun:test";
import type { JsonValue, MithrilEvent, Provider, SerializedError, StandardSchemaV1 } from "../src/protocol/index.ts";
import { toolErrorClass } from "../src/protocol/index.ts";
import { agent, agentLoop, MithrilError, toSerializedError, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn } from "../src/testkit/index.ts";

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────
function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
function rejectSchema(): StandardSchemaV1<unknown, { city: string }> {
  return { "~standard": { version: 1, vendor: "test", validate: () => ({ issues: [{ message: "city is required" }] }) } };
}
// Read a string field off a SerializedError.data without reaching for `any`.
function dataField(err: SerializedError, key: string): string | undefined {
  const d = err.data;
  if (d === null || typeof d !== "object" || Array.isArray(d)) return undefined;
  const v = (d as { readonly [k: string]: JsonValue })[key];
  return typeof v === "string" ? v : undefined;
}
async function collect<R>(gen: AsyncGenerator<MithrilEvent, R>): Promise<{ readonly events: readonly MithrilEvent[]; readonly result: R }> {
  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) return { events, result: r.value };
    events.push(r.value);
  }
}

// ── the loop never crashes: exceptions become typed terminal errors ────────────────────────────────

test("a provider that throws mid-stream yields a typed, retryable run.error — not a crash", async () => {
  const boomProvider: Provider = {
    spec: { id: "test", models: {} },
    // biome-ignore lint: intentionally throws before yielding to simulate a network drop
    async *chat() {
      throw new Error("network exploded");
    },
  };
  const { events, result } = await collect(
    agentLoop({ model: testModel(boomProvider), instructions: "hi", tools: [], input: "hello", deps: undefined }),
  );
  expect(result.status).toBe("error");
  const err = events.find((e) => e.type === "run.error");
  expect(err?.type).toBe("run.error");
  if (err?.type === "run.error") {
    expect(err.error.retryable).toBe(true);
    expect(dataField(err.error, "code")).toBe("PROVIDER_ERROR");
  }
});

test("a throwing tool-altitude middleware degrades to a tool.error and the run continues", async () => {
  const echo = tool({ name: "echo", description: "", inputSchema: passSchema<{ x: number }>(), execute: async ({ x }) => ({ x }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([toolCallTurn("echo", { x: 1 }), textTurn("done")])),
      instructions: "hi",
      tools: [echo],
      input: "go",
      deps: undefined,
      middlewares: [{ name: "boom", tool: () => { throw new Error("mw boom"); } }],
    }),
  );
  expect(result.status).toBe("completed");
  if (result.status === "completed") expect(result.output).toBe("done");
  expect(events.some((e) => e.type === "tool.error")).toBe(true);
});

// ── tool errors carry a machine-readable class ─────────────────────────────────────────────────────

test("invalid tool input becomes a classified, retryable tool.error the model sees", async () => {
  const weather = tool({ name: "weather", description: "", inputSchema: rejectSchema(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([toolCallTurn("weather", { city: 123 }), textTurn("ok")])),
      instructions: "hi",
      tools: [weather],
      input: "go",
      deps: undefined,
    }),
  );
  const te = events.find((e) => e.type === "tool.error");
  expect(te?.type).toBe("tool.error");
  if (te?.type === "tool.error") {
    expect(toolErrorClass(te.error)).toBe("invalid_args");
    expect(te.error.retryable).toBe(true);
    expect(dataField(te.error, "code")).toBe("INVALID_TOOL_INPUT");
  }
  expect(result.status).toBe("completed"); // the run recovered after the error was fed back
});

test("an unknown tool name becomes an unknown_tool error that lists the available tools", async () => {
  const weather = tool({ name: "weather", description: "", inputSchema: passSchema<{ city: string }>(), execute: async () => ({ ok: true }) });
  const { events } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([toolCallTurn("nonexistent", {}), textTurn("ok")])),
      instructions: "hi",
      tools: [weather],
      input: "go",
      deps: undefined,
    }),
  );
  const te = events.find((e) => e.type === "tool.error");
  expect(te?.type).toBe("tool.error");
  if (te?.type === "tool.error") {
    expect(toolErrorClass(te.error)).toBe("unknown_tool");
    expect(te.error.message).toContain("weather");
  }
});

test("a throwing tool handler degrades to a handler_error tool.error and the run recovers", async () => {
  const boom = tool({ name: "boom", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => { throw new Error("kaboom"); } });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([toolCallTurn("boom", {}), textTurn("recovered")])),
      instructions: "hi",
      tools: [boom],
      input: "go",
      deps: undefined,
    }),
  );
  const te = events.find((e) => e.type === "tool.error");
  expect(te?.type === "tool.error" && toolErrorClass(te.error)).toBe("handler_error");
  expect(result.status).toBe("completed");
});

// ── error taxonomy reaches the wire ────────────────────────────────────────────────────────────────

test("toSerializedError carries a MithrilError code and flags PROVIDER_ERROR retryable", () => {
  const provider = toSerializedError(new MithrilError("PROVIDER_ERROR", "boom"));
  expect(dataField(provider, "code")).toBe("PROVIDER_ERROR");
  expect(provider.retryable).toBe(true);

  const noProvider = toSerializedError(new MithrilError("NO_PROVIDER", "x"));
  expect(dataField(noProvider, "code")).toBe("NO_PROVIDER");
  expect(noProvider.retryable).toBeUndefined();

  const plain = toSerializedError(new Error("plain"));
  expect(plain.data).toBeUndefined();
  expect(plain.name).toBe("Error");
});
