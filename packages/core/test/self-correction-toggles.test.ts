import { expect, test } from "bun:test";
import type { JsonValue, MithrilEvent, Provider, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agentLoop, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn, ZERO_DELTA } from "../src/testkit/index.ts";

// Accepts only { city: string } — rejects a bare string, so coercion is observable.
function citySchema(): StandardSchemaV1<unknown, { city: string }> {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (v) =>
        v !== null && typeof v === "object" && !Array.isArray(v) && typeof (v as { city?: unknown }).city === "string"
          ? { value: v as { city: string } }
          : { issues: [{ message: "expected { city: string }" }] },
    },
  };
}
function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
function spinning(name: string, argsFor: (t: number) => JsonValue, u: UsageDelta = ZERO_DELTA): Provider {
  let t = 0;
  return {
    spec: { id: "test", models: {} },
    async *chat() {
      t += 1;
      yield { type: "tool.call", callId: `c${t}`, name, input: argsFor(t) };
      yield { type: "message.end", usage: u, finishReason: "tool_calls" };
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

// ── repair: false turns off coercion ────────────────────────────────────────────────────────────────

test("repair: false disables coercion — a JSON-string arg now fails instead of being fixed", async () => {
  const weather = tool({ name: "weather", description: "", inputSchema: citySchema(), execute: async () => ({ ok: true }) });
  const script = () => [toolCallTurn("weather", '{"city":"NYC"}'), textTurn("done")] as const;

  const on = await collect(
    agentLoop({ model: testModel(scriptedProvider(script())), instructions: "h", tools: [weather], input: "go", deps: undefined }),
  );
  expect(on.events.some((e) => e.type === "tool.repair")).toBe(true); // default: coerced

  const off = await collect(
    agentLoop({ model: testModel(scriptedProvider(script())), instructions: "h", tools: [weather], input: "go", deps: undefined, repair: false }),
  );
  expect(off.events.some((e) => e.type === "tool.repair")).toBe(false); // no coercion
  expect(off.events.some((e) => e.type === "tool.error")).toBe(true); // it failed validation instead
});

// ── selfCorrection: false reverts to the raw loop ────────────────────────────────────────────────────

test("selfCorrection: false gives a raw loop: no coercion, no loop detection, unbounded tool retries", async () => {
  // A tool that always fails validation, called identically forever. With corrections ON this halts fast
  // (ToolRepairExhausted / LoopDetected); OFF it should run all the way to the maxSteps budget.
  const bad = tool({ name: "bad", description: "", inputSchema: citySchema(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(spinning("bad", () => ({ wrong: true }))),
      instructions: "h",
      tools: [bad],
      input: "go",
      deps: undefined,
      selfCorrection: false,
      maxSteps: 5,
    }),
  );
  expect(events.some((e) => e.type === "tool.repair")).toBe(false);
  expect(events.some((e) => e.type === "tool.retry")).toBe(false);
  expect(events.some((e) => e.type === "loop.detected")).toBe(false);
  expect(result.status).toBe("error");
  if (result.status === "error") expect(result.error.name).toBe("MaxStepsExceeded"); // ran to the budget, not a guard
});

test("crash-hardening is NOT disabled by selfCorrection: false", async () => {
  const boom: Provider = {
    spec: { id: "test", models: {} },
    // biome-ignore lint: throws before yielding to simulate a provider failure
    async *chat() {
      throw new Error("boom");
    },
  };
  const { events, result } = await collect(
    agentLoop({ model: testModel(boom), instructions: "h", tools: [], input: "go", deps: undefined, selfCorrection: false }),
  );
  expect(result.status).toBe("error"); // still a typed terminal, not an uncaught crash
  expect(events.some((e) => e.type === "run.error")).toBe(true);
});

// ── per-flag override beats the master ───────────────────────────────────────────────────────────────

test("a per-feature flag overrides the master: selfCorrection off but loopDetection on still halts loops", async () => {
  const ping = tool({ name: "ping", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => ({ pong: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(spinning("ping", () => ({}))),
      instructions: "h",
      tools: [ping],
      input: "go",
      deps: undefined,
      selfCorrection: false,
      loopDetection: true, // override the master for just this feature
      maxSteps: 20,
    }),
  );
  expect(events.some((e) => e.type === "loop.detected")).toBe(true);
  if (result.status === "error") expect(result.error.name).toBe("LoopDetected");
});
