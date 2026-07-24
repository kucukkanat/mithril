import { expect, test } from "bun:test";
import type { CheckpointRecord, Checkpointer, ProviderChunk, StandardSchemaV1, UsageDelta } from "../src/protocol/index.ts";
import { agent, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO_USAGE: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// A tool.call turn (needs approval → suspends) then a text turn (after resume → completes). The scripted
// provider is positional, so a scenario reuses ONE agent for run + resume (matching hitl.test.ts): the
// provider cursor advances turn0 → turn1 across the model calls. resumeFrom still loads the token from the
// checkpointer, not from any variable — that is the durable-resume behavior under test.
function turns(): ProviderChunk[][] {
  return [
    [
      { type: "tool.call", callId: "c1", name: "deploy", input: { env: "prod" } },
      { type: "message.end", usage: NO_USAGE, finishReason: "tool_calls" },
    ],
    [
      { type: "text.delta", delta: "Deployed." },
      { type: "message.end", usage: NO_USAGE, finishReason: "stop" },
    ],
  ];
}

function makeAgent() {
  const record = { executed: false, env: "" };
  const deploy = tool({
    name: "deploy",
    description: "deploy to an environment",
    inputSchema: schema<{ env: string }>(),
    needsApproval: true,
    execute: async ({ env }) => {
      record.executed = true;
      record.env = env;
      return { ok: true, env };
    },
  });
  const a = agent({ model: testModel(scriptedProvider(turns())), instructions: "help", tools: [deploy] });
  return { a, record };
}

// A minimal in-test Checkpointer (same observable semantics as @mithril/memory's, kept local to avoid a
// cross-package dev dependency): last-write-wins ordering, ifParent optimistic concurrency, idempotent on id.
function testCheckpointer(): Checkpointer {
  const byRun = new Map<string, CheckpointRecord[]>();
  return {
    async put(rec, opts) {
      const list = byRun.get(rec.runId) ?? [];
      if (opts?.ifParent !== undefined) {
        const latestId = list.length > 0 ? (list[list.length - 1]?.checkpointId ?? null) : null;
        if (opts.ifParent !== latestId) return "conflict";
      }
      if (list.some((r) => r.checkpointId === rec.checkpointId)) return "ok";
      list.push(rec);
      byRun.set(rec.runId, list);
      return "ok";
    },
    async latest(runId) {
      const list = byRun.get(runId);
      return list !== undefined && list.length > 0 ? list[list.length - 1] : undefined;
    },
    async get(runId, checkpointId) {
      return byRun.get(runId)?.find((r) => r.checkpointId === checkpointId);
    },
    async *history(runId) {
      for (const r of byRun.get(runId) ?? []) yield r;
    },
    async purge(runId) {
      byRun.delete(runId);
    },
  };
}

test("a run with persistence auto-checkpoints its suspension (token + pending, status=suspended)", async () => {
  const { a } = makeAgent();
  const cp = testCheckpointer();
  const r = await a.run("deploy to prod", { persistence: { checkpointer: cp, runId: "run-1" } });
  expect(r.status).toBe("suspended");

  const latest = await cp.latest("run-1");
  expect(latest?.status).toBe("suspended");
  expect(typeof latest?.token).toBe("string"); // the resumable token was stored for us
  expect(latest?.parentId).toBeNull(); // first checkpoint in the chain
  expect(latest?.pending?.kind).toBe("tool.approval"); // UI-facing descriptor round-trips
});

test("resumeFrom loads the checkpoint and completes — no token handling", async () => {
  const { a, record } = makeAgent();
  const cp = testCheckpointer();
  const persistence = { checkpointer: cp, runId: "run-2" };

  const r = await a.run("deploy to prod", { persistence }); // suspends; we keep NO token variable
  expect(r.status).toBe("suspended");
  expect(record.executed).toBe(false);

  // Resume purely from the runId + the checkpointer (the token is loaded, never touched by the caller).
  const done = await a.resumeFrom("run-2", { kind: "approve" }, { persistence });
  expect(done.status).toBe("completed");
  if (done.status === "completed") expect(done.output).toBe("Deployed.");
  expect(record.executed).toBe(true);
  expect(record.env).toBe("prod");

  // The terminal outcome is chained onto the suspension checkpoint (null token, non-null parent).
  const latest = await cp.latest("run-2");
  expect(latest?.status).toBe("completed");
  expect(latest?.token).toBeNull();
  expect(latest?.parentId).not.toBeNull();
});

test("resumeFrom respects an edited resolution", async () => {
  const { a, record } = makeAgent();
  const cp = testCheckpointer();
  const persistence = { checkpointer: cp, runId: "run-3" };
  await a.run("deploy to prod", { persistence });

  const done = await a.resumeFrom("run-3", { kind: "edit", input: { env: "staging" } }, { persistence });
  expect(done.status).toBe("completed");
  expect(record.env).toBe("staging"); // ran with the human's edit, not the model's args
});

test("seal/open hooks wrap the stored token symmetrically", async () => {
  const { a } = makeAgent();
  const cp = testCheckpointer();
  const opened: string[] = [];
  const persistence = {
    checkpointer: cp,
    runId: "run-4",
    seal: (t: string) => `SEALED:${t}`,
    open: (b: string) => {
      opened.push(b);
      return b.slice("SEALED:".length);
    },
  };
  await a.run("deploy to prod", { persistence });
  expect((await cp.latest("run-4"))?.token?.startsWith("SEALED:")).toBe(true); // stored sealed

  const done = await a.resumeFrom("run-4", { kind: "approve" }, { persistence });
  expect(done.status).toBe("completed"); // open() unwrapped the blob before resume
  expect(opened[0]?.startsWith("SEALED:")).toBe(true);
});

test("a completed run records a terminal checkpoint (no suspension needed)", async () => {
  const textOnly = agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }, { type: "message.end", usage: NO_USAGE, finishReason: "stop" }]])),
    instructions: "help",
  });
  const cp = testCheckpointer();
  const r = await textOnly.run("hello", { persistence: { checkpointer: cp, runId: "run-5" } });
  expect(r.status).toBe("completed");
  const latest = await cp.latest("run-5");
  expect(latest?.status).toBe("completed");
  expect(latest?.token).toBeNull();
});

test("resumeFrom throws NOT_SUSPENDED for an already-completed run", async () => {
  const { a } = makeAgent();
  const cp = testCheckpointer();
  const persistence = { checkpointer: cp, runId: "run-6" };
  await a.run("deploy to prod", { persistence });
  await a.resumeFrom("run-6", { kind: "approve" }, { persistence }); // now completed

  await expect(a.resumeFrom("run-6", { kind: "approve" }, { persistence })).rejects.toThrow(/not resumable/i);
});

test("resumeFrom throws CHECKPOINT_NOT_FOUND for an unknown runId", async () => {
  const persistence = { checkpointer: testCheckpointer(), runId: "nope" };
  await expect(makeAgent().a.resumeFrom("nope", { kind: "approve" }, { persistence })).rejects.toThrow(/No checkpoint found/i);
});

test("resumeFrom throws NO_PERSISTENCE when opts.persistence is absent", async () => {
  await expect(makeAgent().a.resumeFrom("x", { kind: "approve" })).rejects.toThrow(/requires opts\.persistence/i);
});

test("no persistence ⇒ nothing is written and behavior is unchanged", async () => {
  const cp = testCheckpointer();
  const { a } = makeAgent();
  const r = await a.run("deploy to prod"); // no persistence option
  expect(r.status).toBe("suspended");
  expect(await cp.latest("anything")).toBeUndefined();
});

test("stream() with persistence checkpoints, and resumeStreamFrom continues the same run", async () => {
  const { a } = makeAgent();
  const cp = testCheckpointer();
  const persistence = { checkpointer: cp, runId: "run-7" };
  const handle = a.stream("deploy to prod", { persistence });
  const r = await handle.result();
  expect(r.status).toBe("suspended");
  expect(handle.runId).toBe("run-7"); // handle id honors persistence.runId
  expect((await cp.latest("run-7"))?.status).toBe("suspended");

  const resumed = a.resumeStreamFrom("run-7", { kind: "approve" }, { persistence });
  expect(resumed.runId).toBe("run-7"); // same run
  const done = await resumed.result();
  expect(done.status).toBe("completed");
  expect((await cp.latest("run-7"))?.status).toBe("completed");
});
