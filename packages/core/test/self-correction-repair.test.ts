import { expect, test } from "bun:test";
import type { AnyTool, MithrilEvent, Provider, StandardSchemaV1 } from "../src/protocol/index.ts";
import { repairJson } from "../src/protocol/index.ts";
import { agent, agentLoop, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn, ZERO_DELTA } from "../src/testkit/index.ts";

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────
function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
// Accepts only { city: string } — rejects a bare string so coercion can be exercised.
function citySchema(): StandardSchemaV1<unknown, { city: string }> {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (v) => {
        if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof (v as { city?: unknown }).city === "string") {
          return { value: v as { city: string } };
        }
        return { issues: [{ message: "expected { city: string }" }] };
      },
    },
  };
}
function alwaysRejects<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: () => ({ issues: [{ message: "rejected" }] }) } };
}
async function collect<R>(gen: AsyncGenerator<MithrilEvent, R>): Promise<{ readonly events: readonly MithrilEvent[]; readonly result: R }> {
  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) return { events, result: r.value };
    events.push(r.value);
  }
}

// ── deterministic parse-repair (shared helper) ─────────────────────────────────────────────────────

test("repairJson fixes the common small-model JSON slips, losslessly for valid JSON", () => {
  expect(repairJson('{"a":1}')).toEqual({ a: 1 }); // fast path, unchanged
  expect(repairJson('```json\n{"a":1}\n```')).toEqual({ a: 1 }); // code fence
  expect(repairJson('{"a":1,}')).toEqual({ a: 1 }); // trailing comma
  expect(repairJson('{"a":1')).toEqual({ a: 1 }); // unterminated object
  expect(repairJson('{"a":"oops')).toEqual({ a: "oops" }); // unterminated string
  expect(repairJson("[1,2,")).toEqual([1, 2]); // unterminated array + trailing comma
  expect(repairJson("not json")).toBeUndefined();
  expect(repairJson("")).toBeUndefined();
});

// ── visible schema coercion → tool.repair ──────────────────────────────────────────────────────────

test("a JSON-string of the args is coerced to the object and emits a visible tool.repair", async () => {
  let ranWith: unknown;
  const weather = tool({
    name: "weather",
    description: "",
    inputSchema: citySchema(),
    execute: async (input) => {
      ranWith = input;
      return { ok: true };
    },
  });
  const { events, result } = await collect(
    agentLoop({
      // the model emits the whole args object as a JSON string (a common small-model slip)
      model: testModel(scriptedProvider([toolCallTurn("weather", '{"city":"NYC"}'), textTurn("done")])),
      instructions: "hi",
      tools: [weather],
      input: "go",
      deps: undefined,
    }),
  );
  const repair = events.find((e) => e.type === "tool.repair");
  expect(repair?.type).toBe("tool.repair");
  if (repair?.type === "tool.repair") {
    expect(repair.mechanism).toBe("coerce");
    expect(repair.before).toBe('{"city":"NYC"}');
    expect(repair.after).toEqual({ city: "NYC" });
  }
  expect(ranWith).toEqual({ city: "NYC" }); // the tool actually ran with the coerced args
  expect(result.status).toBe("completed");
});

// ── bounded per-tool repair budget ───────────────────────────────────────────────────────────────

test("a tool that keeps failing ends with a clear terminal error after toolRetries, not at maxSteps", async () => {
  // A provider that calls the failing tool every single turn.
  let n = 0;
  const spinning: Provider = {
    spec: { id: "test", models: {} },
    async *chat() {
      n += 1;
      yield { type: "tool.call", callId: `c${n}`, name: "bad", input: { anything: true } };
      yield { type: "message.end", usage: ZERO_DELTA, finishReason: "tool_calls" };
    },
  };
  const bad = tool({ name: "bad", description: "", inputSchema: alwaysRejects<{ x: number }>(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({ model: testModel(spinning), instructions: "hi", tools: [bad], input: "go", deps: undefined, toolRetries: 2 }),
  );
  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.error.name).toBe("ToolRepairExhausted"); // NOT MaxStepsExceeded
  }
  // 2 retries under budget were surfaced before giving up on the 3rd consecutive failure.
  const retries = events.filter((e) => e.type === "tool.retry");
  expect(retries.length).toBe(2);
  expect(n).toBe(3); // exactly 3 model turns, far under the 16-step default
});

test("toolRetries: 0 gives up on the first failure", async () => {
  let n = 0;
  const spinning: Provider = {
    spec: { id: "test", models: {} },
    async *chat() {
      n += 1;
      yield { type: "tool.call", callId: `c${n}`, name: "bad", input: {} };
      yield { type: "message.end", usage: ZERO_DELTA, finishReason: "tool_calls" };
    },
  };
  const bad = tool({ name: "bad", description: "", inputSchema: alwaysRejects<Record<string, never>>(), execute: async () => ({ ok: true }) });
  const { result } = await collect(
    agentLoop({ model: testModel(spinning), instructions: "hi", tools: [bad], input: "go", deps: undefined, toolRetries: 0 }),
  );
  expect(result.status).toBe("error");
  expect(n).toBe(1);
});

// ── tool output validation ─────────────────────────────────────────────────────────────────────────

test("a tool whose output violates its outputSchema surfaces an invalid_output tool.error", async () => {
  const bad = tool({
    name: "bad",
    description: "",
    inputSchema: passSchema<Record<string, never>>(),
    outputSchema: alwaysRejects<{ ok: boolean }>(),
    execute: async () => ({ ok: true }),
  });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([toolCallTurn("bad", {}), textTurn("recovered")])),
      instructions: "hi",
      tools: [bad],
      input: "go",
      deps: undefined,
    }),
  );
  const te = events.find((e) => e.type === "tool.error");
  expect(te?.type).toBe("tool.error");
  if (te?.type === "tool.error") {
    const cls = te.error.data !== null && typeof te.error.data === "object" && !Array.isArray(te.error.data) ? (te.error.data as { class?: string }).class : undefined;
    expect(cls).toBe("invalid_output");
  }
  expect(result.status).toBe("completed"); // the run continued after the error was fed back
});

// ── few-shot examples surfaced into the wire description ─────────────────────────────────────────────

test("tool examples are surfaced into the description the provider receives", async () => {
  const captured: { tools?: readonly AnyTool<unknown>[] } = {};
  const capturing: Provider = {
    spec: { id: "test", models: {} },
    async *chat(req) {
      captured.tools = req.tools;
      yield { type: "text.delta", delta: "ok" };
      yield { type: "message.end", usage: ZERO_DELTA, finishReason: "stop" };
    },
  };
  const weather = tool({
    name: "weather",
    description: "Look up weather.",
    examples: [{ city: "NYC" }, { city: "Paris" }],
    inputSchema: passSchema<{ city: string }>(),
    execute: async () => ({ ok: true }),
  });
  await agent({ model: testModel(capturing), instructions: "hi", tools: [weather] }).run("go");
  const desc = captured.tools?.[0]?.description ?? "";
  expect(desc).toContain("Example calls:");
  expect(desc).toContain('{"city":"NYC"}');
  expect(desc).toContain("Look up weather."); // original description preserved
});
