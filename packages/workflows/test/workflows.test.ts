import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { defineWorkflow, done, goto } from "../src/index.ts";

interface S {
  readonly amount: number;
  readonly note: string;
}

test("routes deterministically over shared state", async () => {
  const wf = defineWorkflow<S>(
    {
      classify: (s) => (s.amount > 100 ? goto("review", s) : goto("approve", s)),
      review: (s) => done({ ...s, note: "needs review" }),
      approve: (s) => done({ ...s, note: "auto-approved" }),
    },
    { start: "classify" },
  );

  const big = await wf.run({ amount: 500, note: "" });
  expect(big.state.note).toBe("needs review");
  expect(big.path).toEqual(["classify", "review"]);

  const small = await wf.run({ amount: 5, note: "" });
  expect(small.state.note).toBe("auto-approved");
  expect(small.path).toEqual(["classify", "approve"]);
});

test("a step can run an agent and route on its output", async () => {
  function schema<T>(): StandardSchemaV1<unknown, T> {
    return { "~standard": { version: 1, vendor: "t", validate: (v) => ({ value: v as T }) } };
  }
  const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
  const noop = tool({ name: "noop", description: "", inputSchema: schema<Record<string, never>>(), execute: async () => ({}) });
  const turns: ProviderChunk[][] = [[{ type: "text.delta", delta: "SUMMARY" }, { type: "message.end", usage: NO, finishReason: "stop" }]];
  const summarizer = agent({ model: testModel(scriptedProvider(turns)), instructions: "summarize", tools: [noop] });

  const wf = defineWorkflow<{ text: string }>(
    {
      summarize: async (s) => {
        const r = await summarizer.run(s.text);
        return done({ text: r.status === "completed" ? r.output : "" });
      },
    },
    { start: "summarize" },
  );
  const out = await wf.run({ text: "long document" });
  expect(out.state.text).toBe("SUMMARY");
});

test("detects cycles via maxSteps", async () => {
  const wf = defineWorkflow<number>({ a: (n) => goto("b", n), b: (n) => goto("a", n) }, { start: "a", maxSteps: 5 });
  await expect(wf.run(0)).rejects.toBeDefined();
});
