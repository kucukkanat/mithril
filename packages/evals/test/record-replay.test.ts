import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { calledTool, completed, fsTrajectoryStore, loadTrajectory, memoryTrajectoryStore, runEvalCached, serializeTrajectory } from "../src/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A model that runs exactly once — the second run of the same provider yields an empty turn. This is what
// makes the record/replay distinction observable: replay must NOT touch the model.
function makeAgent() {
  let calls = 0;
  const search = tool({
    name: "search",
    description: "",
    inputSchema: schema<{ q: string }>(),
    execute: async () => {
      calls++;
      return { hits: [] };
    },
  });
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "search", input: { q: "x" } }, { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "answer" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }],
  ];
  return { a: agent({ model: testModel(scriptedProvider(turns)), instructions: "help", tools: [search] }), toolCalls: () => calls };
}

const cases = [{ name: "search-then-answer", input: "go", scorers: [calledTool("search"), completed()] }];

test("record writes a trajectory; replay re-scores it WITHOUT running the agent", async () => {
  const store = memoryTrajectoryStore();
  const rec = makeAgent();

  const recorded = [];
  for await (const r of runEvalCached(rec.a, cases, { deps: undefined, mode: "record", store })) recorded.push(r);
  expect(recorded[0]?.passed).toBe(true);
  expect(rec.toolCalls()).toBe(1); // ran live once

  // Replay against a FRESH agent whose tool would count executions — replay must not call it.
  const fresh = makeAgent();
  const replayed = [];
  for await (const r of runEvalCached(fresh.a, cases, { deps: undefined, mode: "replay", store })) replayed.push(r);
  expect(replayed[0]?.passed).toBe(true);
  expect(replayed[0]?.scores.map((s) => s.value)).toEqual([1, 1]);
  expect(fresh.toolCalls()).toBe(0); // replay re-emitted the log; the tool never ran
});

test("replay with no recorded trajectory throws", async () => {
  const store = memoryTrajectoryStore();
  const { a } = makeAgent();
  await expect(
    (async () => {
      for await (const _ of runEvalCached(a, cases, { deps: undefined, mode: "replay", store })) void _;
    })(),
  ).rejects.toThrow(/no recorded trajectory/);
});

test("serialize/loadTrajectory round-trips the log and re-derives final state", () => {
  const t = { runId: "r1", log: [], final: { runId: "", status: "running" as const, messages: [], usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0, steps: 0 }, cursor: -1 } };
  const back = loadTrajectory(serializeTrajectory(t));
  expect(back.runId).toBe("r1");
  expect(back.log).toEqual([]);
});

test("fsTrajectoryStore persists via a minimal FileSystem surface", async () => {
  const files = new Map<string, string>();
  const fs = {
    async readText(p: string) {
      const v = files.get(p);
      if (v === undefined) throw new Error("missing");
      return v;
    },
    async writeFile(p: string, data: string | Uint8Array) {
      files.set(p, typeof data === "string" ? data : new TextDecoder().decode(data));
    },
    async exists(p: string) {
      return files.has(p);
    },
  };
  const store = fsTrajectoryStore(fs, { dir: "fx" });
  expect(await store.get("case one")).toBeUndefined();
  await store.put("case one", "hello");
  expect(await store.get("case one")).toBe("hello");
  expect([...files.keys()][0]).toBe("fx/case_one.json"); // sanitized key
});

test("replay keyed on input hash: changing a case's input misses the stale fixture", async () => {
  const { runEvalCached, memoryTrajectoryStore, calledTool } = await import("../src/index.ts");
  const store = memoryTrajectoryStore();
  const { a } = makeAgent();
  const recorded = [{ name: "case-1", input: "original question", scorers: [calledTool("search")] }];
  for await (const _ of runEvalCached(a, recorded, { deps: undefined, mode: "record", store })) void _;

  // Same name, different input → must NOT resolve to the recorded trajectory.
  const changed = [{ name: "case-1", input: "a totally different question", scorers: [calledTool("search")] }];
  let threw = false;
  try {
    for await (const _ of runEvalCached(a, changed, { deps: undefined, mode: "replay", store })) void _;
  } catch (e) {
    threw = true;
    expect((e as Error).message).toContain("input may have changed");
  }
  expect(threw).toBe(true);
});

test("trajectoryToScript rebuilds a script that re-runs the real loop and tools", async () => {
  const { runEval, trajectoryToScript, calledTool, completed } = await import("../src/index.ts");
  const { scriptedProvider, testModel } = await import("@mithril/core/testkit");
  const { agent: buildAgent, tool: buildTool } = await import("@mithril/core/agent");

  // Record a real run.
  const { a } = makeAgent();
  let recorded;
  for await (const r of runEval(a, [{ name: "rec", input: "go", scorers: [completed()] }])) recorded = r;

  // Rebuild a script from the recording and run a fresh agent whose tool ACTUALLY executes.
  let toolRan = 0;
  const search = buildTool({ name: "search", description: "", inputSchema: schema<{ q: string }>(), execute: async () => { toolRan++; return { hits: [] }; } });
  const script = trajectoryToScript(recorded!.trajectory);
  const replayed = buildAgent({ model: testModel(scriptedProvider(script)), instructions: "help", tools: [search] });
  const runs = [];
  for await (const r of runEval(replayed, [{ name: "replayed", input: "go", scorers: [calledTool("search"), completed()] }])) runs.push(r);

  expect(toolRan).toBeGreaterThan(0); // the REAL tool ran during replay (unlike event-log replay)
  expect(runs[0]?.passed).toBe(true);
});
