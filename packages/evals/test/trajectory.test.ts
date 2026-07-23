import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { completed, matchesTrajectory, referenceFromTrajectory, runEval, type Trajectory } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A run that calls search{q:"flights"} then book{city:"Istanbul",seats:2} then answers.
async function fixture(): Promise<Trajectory> {
  const search = tool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => ({ hits: [] }) });
  const book = tool({ name: "book", description: "", inputSchema: schema<{ city: string; seats: number }>(), execute: async () => ({ ok: true }) });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "search", input: { q: "flights" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "tool.call", callId: "c2", name: "book", input: { city: "Istanbul", seats: 2 } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "done" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [search, book] });
  let traj: Trajectory | undefined;
  for await (const r of runEval(a, [{ name: "f", input: "go", scorers: [completed()] }], { deps: undefined })) traj = r.trajectory;
  if (traj === undefined) throw new Error("no trajectory captured");
  return traj;
}

// Score a matcher against the fixture directly (scorers are pure over the trajectory).
async function score(t: Trajectory, ref: Parameters<typeof matchesTrajectory>[0], opts?: Parameters<typeof matchesTrajectory>[1]): Promise<number> {
  return (await matchesTrajectory(ref, opts)(t, undefined)).value;
}

test("mode: strict — exact calls, exact order, 1:1", async () => {
  const t = await fixture();
  const exact = [{ tool: "search", input: { q: "flights" } }, { tool: "book", input: { city: "Istanbul", seats: 2 } }];
  expect(await score(t, exact, { mode: "strict" })).toBe(1);
  expect(await score(t, [{ tool: "search" }], { mode: "strict", toolArgs: "ignore" })).toBe(0); // missing book
  expect(await score(t, [{ tool: "book" }, { tool: "search" }], { mode: "strict", toolArgs: "ignore" })).toBe(0); // wrong order
});

test("mode: superset (default) — reference is an ordered subsequence, extras allowed", async () => {
  const t = await fixture();
  expect(await score(t, [{ tool: "search" }], { toolArgs: "ignore" })).toBe(1); // default mode is superset
  expect(await score(t, [{ tool: "book" }], { mode: "superset", toolArgs: "ignore" })).toBe(1);
  expect(await score(t, [{ tool: "book" }, { tool: "search" }], { mode: "superset", toolArgs: "ignore" })).toBe(0); // wrong order
  expect(await score(t, [{ tool: "pay" }], { mode: "superset", toolArgs: "ignore" })).toBe(0); // absent
});

test("mode: unordered — same multiset, any order", async () => {
  const t = await fixture();
  expect(await score(t, [{ tool: "book" }, { tool: "search" }], { mode: "unordered", toolArgs: "ignore" })).toBe(1);
  expect(await score(t, [{ tool: "search" }], { mode: "unordered", toolArgs: "ignore" })).toBe(0); // fewer
  expect(await score(t, [{ tool: "search" }, { tool: "book" }, { tool: "pay" }], { mode: "unordered", toolArgs: "ignore" })).toBe(0); // more
});

test("mode: subset — every actual call is allowed by the reference; fewer is fine", async () => {
  const t = await fixture();
  expect(await score(t, [{ tool: "search" }, { tool: "book" }, { tool: "pay" }], { mode: "subset", toolArgs: "ignore" })).toBe(1);
  expect(await score(t, [{ tool: "search" }], { mode: "subset", toolArgs: "ignore" })).toBe(0); // book was called but not allowed
});

test("toolArgs modes — exact / ignore / subset / superset", async () => {
  const t = await fixture();
  const one = (ref: Parameters<typeof matchesTrajectory>[0], opts?: Parameters<typeof matchesTrajectory>[1]) => score(t, ref, opts);
  // exact (default when the step has input)
  expect(await one([{ tool: "book", input: { city: "Istanbul", seats: 2 } }])).toBe(1);
  expect(await one([{ tool: "book", input: { city: "Ankara", seats: 2 } }])).toBe(0);
  // ignore — name only
  expect(await one([{ tool: "book", input: { city: "Ankara" } }], { toolArgs: "ignore" })).toBe(1);
  // subset — reference args are contained in the actual args
  expect(await one([{ tool: "book", input: { city: "Istanbul" } }], { toolArgs: "subset" })).toBe(1);
  expect(await one([{ tool: "book", input: { city: "Ankara" } }], { toolArgs: "subset" })).toBe(0);
  // superset — actual args are contained in the reference args
  expect(await one([{ tool: "book", input: { city: "Istanbul", seats: 2, extra: true } }], { toolArgs: "superset" })).toBe(1);
  expect(await one([{ tool: "book", input: { city: "Istanbul" } }], { toolArgs: "superset" })).toBe(0); // actual has an extra `seats`
});

test("perTool comparator overrides the toolArgs mode", async () => {
  const t = await fixture();
  const ref = [{ tool: "book", input: { city: "anything" } }];
  // exact would fail, but the per-tool comparator accepts any city
  expect(await score(t, ref, { perTool: { book: (actual) => typeof (actual as { city?: unknown }).city === "string" } })).toBe(1);
});

test("mismatch is explained in the rationale", async () => {
  const t = await fixture();
  const s = await matchesTrajectory([{ tool: "pay" }], { mode: "superset", toolArgs: "ignore" })(t, undefined);
  expect(s.value).toBe(0);
  expect(s.rationale).toContain("expected");
});

test("referenceFromTrajectory round-trips to a strict match", async () => {
  const t = await fixture();
  const ref = referenceFromTrajectory(t);
  expect(ref).toEqual([
    { tool: "search", input: { q: "flights" } },
    { tool: "book", input: { city: "Istanbul", seats: 2 } },
  ]);
  expect(await score(t, ref, { mode: "strict" })).toBe(1);
});
