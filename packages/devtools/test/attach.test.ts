import { expect, test } from "bun:test";
import { agent } from "@mithril/core/agent";
import type { UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { attachDevtools } from "../src/attach.ts";
import { getGlobalInspector } from "../src/index.ts";

const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function textAgent() {
  return agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO, finishReason: "stop" }]])),
    instructions: "be brief",
  });
}

test("attachDevtools() captures a run into the global inspector with no per-run wiring", async () => {
  const inspector = getGlobalInspector();
  inspector.clear();
  const detach = attachDevtools();
  try {
    await textAgent().run("hello");
    const run = inspector.latest();
    expect(run).toBeDefined();
    expect(run?.state.status).toBe("completed");
    expect(run?.timeline[0]?.type).toBe("run.start");
  } finally {
    detach();
  }
});

test("after detach, new runs are no longer captured", async () => {
  const inspector = getGlobalInspector();
  attachDevtools()(); // attach then immediately detach
  inspector.clear();
  await textAgent().run("hello");
  expect(inspector.runIds()).toHaveLength(0);
});
