import { expect, test } from "bun:test";
import type { MithrilEvent, UsageDelta } from "../src/protocol/index.ts";
import { agent, registerGlobalConsumer } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function textAgent() {
  return agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO, finishReason: "stop" }]])),
    instructions: "be brief",
  });
}

test("a global consumer receives events from a run with NO explicit consumer", async () => {
  const seen: MithrilEvent[] = [];
  const off = registerGlobalConsumer({ name: "test.global", onEvent: (e) => seen.push(e) });
  try {
    const r = await textAgent().run("hello");
    expect(r.status).toBe("completed");
    const types = seen.map((e) => e.type);
    expect(types).toContain("run.start");
    expect(types).toContain("run.finish");
    // monotonic gap-free seqs preserved through the fanout
    seen.forEach((e, i) => expect(e.seq).toBe(i));
  } finally {
    off();
  }
});

test("after unregister, the global consumer stops receiving events", async () => {
  const seen: MithrilEvent[] = [];
  const off = registerGlobalConsumer({ name: "test.global2", onEvent: (e) => seen.push(e) });
  off();
  await textAgent().run("hello");
  expect(seen).toHaveLength(0);
});
