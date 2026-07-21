import { expect, test } from "bun:test";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
// the blessed path — everything from one import:
import { agent, tool } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

test("meta-package re-exports agent+tool and runs end-to-end", async () => {
  const echo = tool({ name: "echo", description: "", inputSchema: schema<{ s: string }>(), execute: async ({ s }) => ({ s }) });
  const turns: ProviderChunk[][] = [[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "x", tools: [echo] });
  const res = await a.run("go");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("hi");
});
