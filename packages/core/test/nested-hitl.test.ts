import { expect, test } from "bun:test";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, asTool, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function callThenAnswer(toolName: string, input: Record<string, unknown>, answer: string): ProviderChunk[][] {
  return [
    [{ type: "tool.call", callId: "c1", name: toolName, input }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: answer }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
}

test("nested HITL: a sub-agent's approval is resumed through the PARENT's token", async () => {
  let deployed: string | undefined;
  // Child agent: calls a needsApproval tool, then answers.
  const deploy = tool({
    name: "deploy",
    description: "deploy",
    inputSchema: schema<{ env: string }>(),
    needsApproval: true,
    execute: async ({ env }) => {
      deployed = env;
      return { ok: true, env };
    },
  });
  const child = agent({
    model: testModel(scriptedProvider(callThenAnswer("deploy", { env: "prod" }, "deployed"))),
    instructions: "deploy when asked",
    tools: [deploy],
  });

  // Parent agent: delegates to the child via asTool, then answers.
  const parent = agent({
    model: testModel(scriptedProvider(callThenAnswer("delegate", { task: "ship it" }, "all done"))),
    instructions: "delegate",
    tools: [asTool(child, { name: "delegate", description: "delegate deployment" })],
  });

  // Parent run suspends because the CHILD's deploy needs approval.
  const r = await parent.run("ship it");
  expect(r.status).toBe("suspended");
  if (r.status !== "suspended") throw new Error("expected suspended");
  expect(r.request.kind).toBe("handoff.suspended");
  // the pending child approval is visible in the payload
  expect((r.request.payload as { child: { kind: string } }).child.kind).toBe("tool.approval");
  expect(deployed).toBeUndefined(); // nothing deployed yet

  // Resume the PARENT with the child's approval decision — the tool resumes the child, which deploys.
  const done = await parent.resume(r.token, { kind: "resolve", value: { kind: "approve" } });
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("all done");
  expect(deployed).toBe("prod"); // the child actually ran after approval
});

test("nested HITL: rejecting the sub-agent's approval still completes the parent", async () => {
  let deployed = false;
  const deploy = tool({
    name: "deploy",
    description: "deploy",
    inputSchema: schema<{ env: string }>(),
    needsApproval: true,
    execute: async () => {
      deployed = true;
      return { ok: true };
    },
  });
  const child = agent({
    model: testModel(scriptedProvider(callThenAnswer("deploy", { env: "prod" }, "child done"))),
    instructions: "deploy",
    tools: [deploy],
  });
  const parent = agent({
    model: testModel(scriptedProvider(callThenAnswer("delegate", { task: "x" }, "parent done"))),
    instructions: "delegate",
    tools: [asTool(child, { name: "delegate", description: "delegate" })],
  });

  const r = await parent.run("go");
  if (r.status !== "suspended") throw new Error("expected suspended");
  const done = await parent.resume(r.token, { kind: "resolve", value: { kind: "reject", message: "no" } });
  expect(done.status).toBe("completed");
  expect(deployed).toBe(false); // rejected — the child never deployed
});
