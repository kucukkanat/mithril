import { expect, test } from "bun:test";
import type { AnyTool, MithrilEvent, Plugin, StandardSchemaV1, ToolDefinition } from "../src/protocol/index.ts";
import { withDigest } from "../src/protocol/index.ts";
import { agent, MithrilError, type RunTokenV3, tool } from "../src/agent/index.ts";
import { memoryCheckpointer } from "../../memory/src/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

// This test owns the body format — `{ echo }`, materialized into a tool that returns it. Core never
// interprets a body; that is exactly what `materialize` exists for.
function bodyOf(def: ToolDefinition): string {
  const b = def.body as { echo?: string } | null;
  return b?.echo ?? "?";
}
function madeDef(name: string, echo: string): ToolDefinition {
  return withDigest({ name, description: `echoes ${echo}`, inputSchema: { type: "object" }, body: { echo } });
}
function fromDef(def: ToolDefinition): AnyTool<unknown> {
  return { name: def.name, description: def.description, inputSchema: schema<unknown>(), execute: () => bodyOf(def) };
}
const materializer: Plugin<unknown> = { name: "test-materializer", materialize: fromDef };

const define = tool({
  name: "define",
  description: "defines a tool",
  inputSchema: schema<Record<string, never>>(),
  execute: async (_i, ctx) => {
    const def = madeDef("created", "hello");
    ctx.tools.register(fromDef(def), def);
    return "defined";
  },
});
const gated = tool({
  name: "gated",
  description: "needs approval",
  inputSchema: schema<Record<string, never>>(),
  needsApproval: true,
  execute: () => "approved-ran",
});

// scriptedProvider is stateful per instance and always starts at turn 0, so a resumed run needs a script
// beginning at the turn AFTER the suspension — not a replay of the original one.
const START = [toolCallTurn("define", {}), toolCallTurn("gated", {}, "c2")];
const AFTER_RESUME = [toolCallTurn("created", {}, "c3"), textTurn("done")];

function startAgent(use: readonly Plugin<unknown>[] = [materializer], tools: readonly AnyTool<unknown>[] = [define, gated]) {
  return agent({ model: testModel(scriptedProvider(START)), instructions: "help", tools, use: [...use] });
}
function resumeAgent(
  use: readonly Plugin<unknown>[] = [materializer],
  tools: readonly AnyTool<unknown>[] = [define, gated],
  script = AFTER_RESUME,
) {
  return agent({ model: testModel(scriptedProvider(script)), instructions: "help", tools, use: [...use] });
}

async function collect(h: { [Symbol.asyncIterator](): AsyncIterator<MithrilEvent> }): Promise<MithrilEvent[]> {
  const out: MithrilEvent[] = [];
  for await (const e of h) out.push(e);
  return out;
}
async function suspendedToken(a = startAgent()): Promise<string> {
  const r = await a.run("go");
  if (r.status !== "suspended") throw new Error(`expected suspended, got ${r.status}`);
  return r.token;
}
const outputs = (events: readonly MithrilEvent[]): unknown[] =>
  events.filter((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result").map((e) => e.output);

test("a suspended token carries the run's created tools as v3", async () => {
  const token = JSON.parse(await suspendedToken()) as RunTokenV3;
  expect(token.v).toBe(3);
  expect(token.tools?.map((t) => t.name)).toEqual(["created"]);
  expect(token.tools?.[0]?.body).toEqual({ echo: "hello" });
});

test("a fresh agent resumes the token and dispatches the rebuilt tool", async () => {
  const token = await suspendedToken();
  // A *different* agent instance: nothing carries over but the token, as in a new process.
  const events = await collect(resumeAgent().resumeStream(token, { kind: "approve" }));
  expect(outputs(events)).toEqual(["approved-ran", "hello"]);
});

test("resume re-registers the rebuilt tool on the stream, so the log still explains it", async () => {
  const token = await suspendedToken();
  const events = await collect(resumeAgent().resumeStream(token, { kind: "approve" }));
  const reg = events.find((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered");
  expect(reg?.name).toBe("created");
  expect(reg?.definition.body).toEqual({ echo: "hello" });
});

test("a v2 token still resumes — it simply has no tools to rebuild", async () => {
  const v3 = JSON.parse(await suspendedToken()) as RunTokenV3;
  const { tools: _dropped, ...rest } = v3;
  const v2 = JSON.stringify({ ...rest, v: 2 });
  // `created` is gone, so the scripted call to it is an unknown_tool error — but the run still resumes.
  const events = await collect(resumeAgent().resumeStream(v2, { kind: "approve" }));
  expect(outputs(events)).toEqual(["approved-ran"]);
  expect(events.some((e) => e.type === "tool.error")).toBe(true);
});

test("a token with tools but no materializer fails loudly instead of reporting unknown_tool", async () => {
  const token = await suspendedToken();
  const res = await resumeAgent([]).resume(token, { kind: "approve" });
  expect(res.status).toBe("error");
  if (res.status !== "error") return;
  expect(res.error.message).toContain("no plugin");
  expect(res.error.message).toContain("created");
});

test("the token wins over setup: a tool revoked before suspending stays revoked", async () => {
  // `reloader` re-installs `created` on every run, the way a store-backed plugin would. The token records
  // that the run revoked it, so a merge would silently resurrect it. A replace must not.
  const def = madeDef("created", "from-store");
  const reloader: Plugin<unknown> = {
    name: "reloader",
    materialize: fromDef,
    setup: (host) => {
      host.tools.register(fromDef(def), { kind: "setup", plugin: "reloader" }, def);
    },
  };
  const revoker = tool({
    name: "define",
    description: "revokes the store-loaded tool",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => (ctx.tools.revoke("created") ? "revoked" : "absent"),
  });

  const token = await suspendedToken(startAgent([reloader], [revoker, gated]));
  expect((JSON.parse(token) as RunTokenV3).tools ?? []).toEqual([]);

  const events = await collect(resumeAgent([reloader], [revoker, gated]).resumeStream(token, { kind: "approve" }));
  const errs = events.filter((e): e is MithrilEvent & { type: "tool.error" } => e.type === "tool.error");
  expect(errs.some((e) => e.error.message.includes('No tool "created"'))).toBe(true);
});

test("setup still wins for a run that never touched the tool", async () => {
  // The mirror of the previous test: with no revoke, the store-loaded tool is present after resume.
  const def = madeDef("created", "from-store");
  const reloader: Plugin<unknown> = {
    name: "reloader",
    materialize: fromDef,
    setup: (host) => {
      host.tools.register(fromDef(def), { kind: "setup", plugin: "reloader" }, def);
    },
  };
  const noop = tool({ name: "define", description: "does nothing", inputSchema: schema<Record<string, never>>(), execute: () => "noop" });
  const token = await suspendedToken(startAgent([reloader], [noop, gated]));
  const events = await collect(resumeAgent([reloader], [noop, gated]).resumeStream(token, { kind: "approve" }));
  expect(outputs(events)).toEqual(["approved-ran", "from-store"]);
});

test("resumeFrom rebuilds a runtime tool out of a checkpoint", async () => {
  const persistence = { checkpointer: memoryCheckpointer(), runId: "run-1" };
  const first = await startAgent().run("go", { persistence });
  expect(first.status).toBe("suspended");
  const events = await collect(resumeAgent().resumeStreamFrom("run-1", { kind: "approve" }, { persistence }));
  expect(outputs(events)).toEqual(["approved-ran", "hello"]);
});

test("a materializer is only demanded when the token actually carries tools", async () => {
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("gated", {})])),
    instructions: "help",
    tools: [gated],
  });
  const r = await a.run("go");
  if (r.status !== "suspended") throw new Error("expected suspended");
  expect((JSON.parse(r.token) as RunTokenV3).tools).toBeUndefined();
  const res = await resumeAgent([], [gated], [textTurn("done")]).resume(r.token, { kind: "approve" });
  expect(res.status).toBe("completed");
});

test("a rejected approval still resumes with the created tool intact", async () => {
  const token = await suspendedToken();
  const events = await collect(resumeAgent().resumeStream(token, { kind: "reject", message: "no" }));
  expect(outputs(events)).toEqual([{ approved: false, message: "no" }, "hello"]);
});

test("a tool contributed without a definition is not carried in the token, but setup restores it", async () => {
  const plain: AnyTool<unknown> = { name: "plain", description: "d", inputSchema: schema<unknown>(), execute: () => "plain-ran" };
  const p: Plugin<unknown> = {
    name: "p",
    setup: (host) => {
      host.register({ tools: [plain] });
    },
  };
  const a = agent({ model: testModel(scriptedProvider([toolCallTurn("gated", {})])), instructions: "help", tools: [gated], use: [p] });
  const r = await a.run("go");
  if (r.status !== "suspended") throw new Error("expected suspended");
  expect((JSON.parse(r.token) as RunTokenV3).tools).toBeUndefined();
  const events = await collect(
    resumeAgent([p], [gated], [toolCallTurn("plain", {}, "c9"), textTurn("done")]).resumeStream(r.token, { kind: "approve" }),
  );
  expect(outputs(events)).toEqual(["approved-ran", "plain-ran"]);
});

test("an unsupported token version is a typed MithrilError", () => {
  expect(() => startAgent().resume(JSON.stringify({ v: 9 }), { kind: "approve" })).toThrow(MithrilError);
});
