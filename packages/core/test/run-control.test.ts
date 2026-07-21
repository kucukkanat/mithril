import { expect, test } from "bun:test";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import type { RunResult, StepSnapshot } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function toolThenText(): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: "weather", input: { city: "NYC" } },
      { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" },
    ],
    [
      { type: "text.delta", delta: "sunny" },
      { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
    ],
  ];
}

function weatherAgent() {
  const weather = tool({
    name: "weather",
    description: "current weather",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => ({ temp: 20, city }),
  });
  return agent({ model: testModel(scriptedProvider(toolThenText())), instructions: "help", tools: [weather] });
}

// ── iterate(): step-level control ────────────────────────────────────────────────────────────────────────
test("iterate() yields a snapshot per step and returns the final result", async () => {
  const it = weatherAgent().iterate("weather?");
  const snapshots: StepSnapshot[] = [];
  let result: RunResult<string> | undefined;
  for (;;) {
    const r = await it.next();
    if (r.done) {
      result = r.value;
      break;
    }
    snapshots.push(r.value);
  }
  expect(snapshots.length).toBe(2); // step 0 (tool) + step 1 (text)
  expect(snapshots[0]?.step).toBe(0);
  expect(snapshots[1]?.step).toBe(1);
  // the snapshot state is a replay of everything so far
  expect(snapshots[1]?.state.messages.some((m) => m.role === "assistant" && m.content.includes("sunny"))).toBe(true);
  expect(result?.status).toBe("completed");
});

test("iterate() breaking early cancels the underlying run", async () => {
  const it = weatherAgent().iterate("weather?");
  const first = await it.next();
  expect(first.done).toBe(false);
  // Break out: the generator's finally aborts the run. Should not throw.
  const ret = await it.return(undefined as never);
  expect(ret.done).toBe(true);
});

// ── cancel(): real handle-level abort ────────────────────────────────────────────────────────────────────
test("RunHandle.cancel() aborts the run at the next step boundary", async () => {
  const h = weatherAgent().stream("weather?");
  h.cancel("user aborted"); // synchronous, before the driver advances past the first step check
  const r = await h.result();
  expect(r.status).toBe("cancelled");
});

test("an already-aborted signal yields a cancelled run", async () => {
  const r = await weatherAgent().run("weather?", { deps: undefined, signal: AbortSignal.abort() });
  expect(r.status).toBe("cancelled");
});
