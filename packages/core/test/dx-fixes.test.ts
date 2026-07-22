import { expect, test } from "bun:test";
import type { Provider, ProviderChunk, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A model that never stops calling a tool — the only way the loop ends is by hitting maxSteps.
function loopingProvider(): Provider {
  return {
    spec: { id: "test", models: {} },
    async *chat() {
      yield { type: "tool.call", callId: "c1", name: "noop", input: {} };
      yield { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" };
    },
  };
}

const noop = tool({
  name: "noop",
  description: "does nothing",
  inputSchema: { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v }) } },
  execute: async () => ({ ok: true }),
});

test("hitting maxSteps returns a typed error, not completed-with-empty-output", async () => {
  const a = agent({ model: testModel(loopingProvider()), instructions: "loop", tools: [noop], maxSteps: 3 });
  const r = await a.run("go");
  expect(r.status).toBe("error");
  if (r.status === "error") {
    expect(r.error.name).toBe("MaxStepsExceeded");
    expect(r.error.message).toContain("3-step budget");
  }
});

test("a no-deps agent can pass run options without the deps: undefined ceremony", async () => {
  const turns: ProviderChunk[][] = [[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "be brief" });
  // The point of this test is that { signal } type-checks with no `deps` field (see RunOptions<void>).
  const r = await a.run("hello", { signal: AbortSignal.timeout(5_000) });
  expect(r.status).toBe("completed");
});

test("an abort reason surfaces on the run.cancel event (not flattened to 'aborted')", async () => {
  // An already-aborted signal makes the step-0 boundary check fire deterministically, with the reason intact.
  const a = agent({ model: testModel(loopingProvider()), instructions: "loop", tools: [noop] });
  const handle = a.stream("go", { signal: AbortSignal.abort("user navigated away") });
  const reasons: string[] = [];
  for await (const e of handle.events) {
    if (e.type === "run.cancel") reasons.push(e.reason);
  }
  const r = await handle.result();
  expect(r.status).toBe("cancelled");
  expect(reasons).toEqual(["user navigated away"]);
});

test("testkit turn builders replace hand-written message.end boilerplate", async () => {
  const { textTurn, toolCallTurn } = await import("../src/testkit/index.ts");
  const echo = tool({
    name: "echo",
    description: "echo",
    inputSchema: { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v }) } },
    execute: async () => ({ ok: true }),
  });
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("echo", { s: "hi" }), textTurn("all done")])),
    instructions: "x",
    tools: [echo],
  });
  const r = await a.run("go");
  expect(r.status).toBe("completed");
  if (r.status === "completed") expect(r.output).toBe("all done");
});
