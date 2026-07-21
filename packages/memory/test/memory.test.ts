import { expect, test } from "bun:test";
import { agent, open, seal, singleKeyring, generateStateKey, tool } from "@mithril/core/agent";
import type { StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { checkpointerConformance, memoryCheckpointer } from "../src/index.ts";

// Every Checkpointer impl runs the shared conformance suite.
checkpointerConformance(async () => memoryCheckpointer(), {
  test,
  assertEqual: (a, b) => expect(a).toEqual(b as never),
});

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

test("end-to-end: suspend → seal + persist token → load → resume", async () => {
  const deploy = tool({
    name: "deploy",
    description: "",
    inputSchema: schema<{ env: string }>(),
    needsApproval: true,
    execute: async ({ env }) => ({ ok: true, env }),
  });
  const turns = [
    [{ type: "tool.call" as const, callId: "c1", name: "deploy", input: { env: "prod" } }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "tool_calls" as const }],
    [{ type: "text.delta" as const, delta: "done" }, { type: "message.end" as const, usage: NO_USAGE, finishReason: "stop" as const }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [deploy] });

  const suspended = await a.run("deploy");
  if (suspended.status !== "suspended") throw new Error("expected suspended");

  // The app seals the token and stores it in a Checkpointer (durable pattern).
  const keyring = singleKeyring(await generateStateKey());
  const sealed = await seal(suspended.token, keyring);
  const cp = memoryCheckpointer();
  await cp.put({ runId: "run-1", checkpointId: "c1", parentId: null, token: sealed, status: "suspended", createdAt: "1970-01-01T00:00:00.000Z" });

  // Later / elsewhere: load, open (verify), resume.
  const stored = await cp.latest("run-1");
  if (stored?.token == null) throw new Error("no stored token");
  const rawToken = await open(stored.token, keyring);
  const done = await a.resume(rawToken, { kind: "approve" });
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("done");
});
