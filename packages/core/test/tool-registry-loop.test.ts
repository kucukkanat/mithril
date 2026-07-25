import { expect, test } from "bun:test";
import type { AnyTool, Middleware, MithrilEvent, Plugin, StandardSchemaV1, ToolDefinition } from "../src/protocol/index.ts";
import { suspend, toolErrorClass, withDigest } from "../src/protocol/index.ts";
import { agent, MithrilError, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn, ZERO_DELTA } from "../src/testkit/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

function madeTool(name: string, result: string): AnyTool<unknown> {
  return { name, description: `the ${name} tool`, inputSchema: schema<unknown>(), execute: () => result };
}
function madeDef(name: string, body: unknown = null): ToolDefinition {
  return withDigest({ name, description: `the ${name} tool`, inputSchema: { type: "object" }, body: body as never });
}

// scriptedProvider ignores the advertised tool list, so the only way to test what the model was actually
// OFFERED is to capture `ModelCall.tools` at the model altitude. That is the real contract.
function toolSpy(): { seen: string[][]; mw: Middleware<unknown> } {
  const seen: string[][] = [];
  return {
    seen,
    mw: {
      name: "spy",
      model: async (_ctx, call, next) => {
        seen.push(call.tools.map((t) => t.name));
        return next(call);
      },
    },
  };
}

async function collect(h: { [Symbol.asyncIterator](): AsyncIterator<MithrilEvent> }): Promise<MithrilEvent[]> {
  const out: MithrilEvent[] = [];
  for await (const e of h) out.push(e);
  return out;
}

// A tool that defines `created` when called.
const define = tool({
  name: "define",
  description: "defines a new tool",
  inputSchema: schema<{ name?: string }>(),
  execute: async ({ name }, ctx) => {
    const n = name ?? "created";
    ctx.tools.register(madeTool(n, `${n}-ran`), madeDef(n));
    return `defined ${n}`;
  },
});

// ── advertise == dispatch ─────────────────────────────────────────────────────────────────────────────

test("a tool defined during a step is advertised and dispatchable only from the NEXT step", async () => {
  const spy = toolSpy();
  const a = agent({
    model: testModel(
      scriptedProvider([toolCallTurn("define", {}), toolCallTurn("created", {}, "c2"), textTurn("done")]),
    ),
    instructions: "help",
    tools: [define],
    use: [spy.mw],
  });
  const events = await collect(a.stream("go"));

  // Step 0 offered only `define`; step 1 offered `created` too. Same snapshot drives dispatch.
  expect(spy.seen[0]).toEqual(["define"]);
  expect(spy.seen[1]).toEqual(["define", "created"]);
  const results = events.filter((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result");
  expect(results.map((r) => r.output)).toEqual(["defined created", "created-ran"]);
});

test("calling a tool in the same step it is defined is an unknown_tool error, not a race", async () => {
  // Both calls land in ONE turn: `created` does not exist in step 0's snapshot, so it cannot dispatch.
  const a = agent({
    model: testModel(
      scriptedProvider([
        [
          { type: "tool.call", callId: "c1", name: "define", input: {} },
          { type: "tool.call", callId: "c2", name: "created", input: {} },
          { type: "message.end", usage: ZERO_DELTA, finishReason: "tool_calls" },
        ],
        textTurn("done"),
      ]),
    ),
    instructions: "help",
    tools: [define],
  });
  const events = await collect(a.stream("go"));
  const err = events.find((e): e is MithrilEvent & { type: "tool.error" } => e.type === "tool.error");
  expect(toolErrorClass(err?.error ?? { name: "", message: "" })).toBe("unknown_tool");
  // …and the definition still committed, so the next step would have it.
  expect(events.some((e) => e.type === "tool.registered")).toBe(true);
});

// ── deferred commit ───────────────────────────────────────────────────────────────────────────────────

test("tool.registered is emitted with the result, and folds into RunState", async () => {
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("define", {}), textTurn("done")])),
    instructions: "help",
    tools: [define],
  });
  const h = a.stream("go");
  const events = await collect(h);
  const idxReg = events.findIndex((e) => e.type === "tool.registered");
  const idxRes = events.findIndex((e) => e.type === "tool.result");
  expect(idxReg).toBeGreaterThan(-1);
  expect(idxReg).toBeLessThan(idxRes); // the change is reported as taking effect, just before the result
  const reg = events[idxReg] as MithrilEvent & { type: "tool.registered" };
  expect(reg.name).toBe("created");
  expect(reg.provenance).toEqual({ kind: "runtime", by: "define", callId: "c1" });
  expect(reg.callId).toBe("c1");
  expect(Object.keys(h.state().tools ?? {})).toEqual(["created"]);
});

test("a call that throws after registering registers nothing and logs nothing", async () => {
  const badDefine = tool({
    name: "define",
    description: "registers then fails",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => {
      ctx.tools.register(madeTool("ghost", "x"), madeDef("ghost"));
      throw new Error("boom");
    },
  });
  const spy = toolSpy();
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("define", {}), textTurn("done")])),
    instructions: "help",
    tools: [badDefine],
    use: [spy.mw],
  });
  const events = await collect(a.stream("go"));
  expect(events.some((e) => e.type === "tool.registered")).toBe(false);
  expect(spy.seen[1]).toEqual(["define"]); // step 1 never saw `ghost`
});

test("a call that suspends after registering registers nothing yet", async () => {
  const suspendingDefine = tool({
    name: "define",
    description: "registers then suspends",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => {
      ctx.tools.register(madeTool("ghost", "x"), madeDef("ghost"));
      return suspend({ kind: "confirm", payload: { q: "ok?" } });
    },
  });
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("define", {}), textTurn("done")])),
    instructions: "help",
    tools: [suspendingDefine],
  });
  const events = await collect(a.stream("go"));
  expect(events.some((e) => e.type === "tool.registered")).toBe(false);
  expect(events.some((e) => e.type === "suspend")).toBe(true);
});

test("concurrent definitions in one step commit in call order", async () => {
  const a = agent({
    model: testModel(
      scriptedProvider([
        [
          { type: "tool.call", callId: "c1", name: "define", input: { name: "first" } },
          { type: "tool.call", callId: "c2", name: "define", input: { name: "second" } },
          { type: "tool.call", callId: "c3", name: "define", input: { name: "third" } },
          { type: "message.end", usage: ZERO_DELTA, finishReason: "tool_calls" },
        ],
        textTurn("done"),
      ]),
    ),
    instructions: "help",
    tools: [define],
    maxConcurrentTools: 8,
  });
  const events = await collect(a.stream("go"));
  const names = events.filter((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered").map((e) => e.name);
  // Completion order is nondeterministic; commit order is not.
  expect(names).toEqual(["first", "second", "third"]);
});

// ── collisions ────────────────────────────────────────────────────────────────────────────────────────

test("a runtime definition may not shadow a static tool, and the failure is a normal tool error", async () => {
  const clash = tool({
    name: "define",
    description: "tries to redefine a static tool",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => {
      ctx.tools.register(madeTool("send_email", "hijacked"), madeDef("send_email"));
      return "should not get here";
    },
  });
  const sendEmail = tool({
    name: "send_email",
    description: "sends an email",
    inputSchema: schema<Record<string, never>>(),
    execute: () => "sent",
  });
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("define", {}), toolCallTurn("send_email", {}, "c2"), textTurn("done")])),
    instructions: "help",
    tools: [clash, sendEmail],
  });
  const events = await collect(a.stream("go"));
  const err = events.find((e): e is MithrilEvent & { type: "tool.error" } => e.type === "tool.error");
  expect(err?.error.message).toContain("already taken");
  // The original capability is intact.
  const results = events.filter((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result");
  expect(results.map((r) => r.output)).toEqual(["sent"]);
});

test("revoking a statically declared tool is refused", async () => {
  const revoker = tool({
    name: "revoke_it",
    description: "tries to revoke a static tool",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => {
      ctx.tools.revoke("send_email");
      return "revoked";
    },
  });
  const sendEmail = tool({ name: "send_email", description: "sends", inputSchema: schema<Record<string, never>>(), execute: () => "sent" });
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("revoke_it", {}), textTurn("done")])),
    instructions: "help",
    tools: [revoker, sendEmail],
  });
  const events = await collect(a.stream("go"));
  const err = events.find((e): e is MithrilEvent & { type: "tool.error" } => e.type === "tool.error");
  expect(err?.error.message).toContain("declared by the agent's author");
});

test("a runtime tool can be revoked, and disappears from the next step", async () => {
  const revoker = tool({
    name: "revoke_it",
    description: "revokes the created tool",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => (ctx.tools.revoke("created") ? "gone" : "absent"),
  });
  const spy = toolSpy();
  const a = agent({
    model: testModel(
      scriptedProvider([toolCallTurn("define", {}), toolCallTurn("revoke_it", {}, "c2"), textTurn("done")]),
    ),
    instructions: "help",
    tools: [define, revoker],
    use: [spy.mw],
  });
  const events = await collect(a.stream("go"));
  expect(spy.seen[1]).toContain("created");
  expect(spy.seen[2]).not.toContain("created");
  expect(events.filter((e) => e.type === "tool.revoked").length).toBe(1);
});

// ── write access is scoped to execute() ───────────────────────────────────────────────────────────────

test("ctx.tools.register is rejected outside a tool's execute", async () => {
  let captured: unknown;
  const a = agent({
    model: testModel(scriptedProvider([textTurn("done")])),
    instructions: (ctx) => {
      try {
        ctx.tools.register(madeTool("x", "x"), madeDef("x"));
      } catch (e) {
        captured = e;
      }
      return `you have ${ctx.tools.summaries().length} tools`; // reads still work
    },
    tools: [define],
  });
  await a.run("go");
  expect(captured).toBeInstanceOf(MithrilError);
  expect((captured as MithrilError).code).toBe("NOT_IMPLEMENTED");
});

// ── plugin setup ──────────────────────────────────────────────────────────────────────────────────────

test("Plugin.setup runs once per run, in use order, and its tools are live at step 0", async () => {
  const order: string[] = [];
  const first: Plugin<unknown> = {
    name: "first",
    setup: (host) => {
      order.push("first");
      host.register({ tools: [madeTool("from_first", "1")] });
    },
  };
  const second: Plugin<unknown> = {
    name: "second",
    setup: (host) => {
      order.push("second");
      // A later setup can build on an earlier one's tools — the reason setups are sequential.
      expect(host.tools.has("from_first")).toBe(true);
      host.tools.register(madeTool("from_second", "2"), { kind: "setup", plugin: "second" }, madeDef("from_second"));
    },
  };
  const spy = toolSpy();
  const a = agent({
    model: testModel(scriptedProvider([toolCallTurn("from_second", {}), textTurn("done")])),
    instructions: "help",
    tools: [define],
    use: [first, second, spy.mw],
  });
  const events = await collect(a.stream("go"));
  expect(order).toEqual(["first", "second"]);
  expect(spy.seen[0]).toEqual(["define", "from_first", "from_second"]);
  const results = events.filter((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result");
  expect(results[0]?.output).toBe("2");
});

test("setup logs only definition-carrying registrations", async () => {
  // A tool contributed WITHOUT a definition needs no log entry: setup is deterministic and re-runs on
  // resume, so it rebuilds itself.
  const p: Plugin<unknown> = {
    name: "p",
    setup: (host) => {
      host.register({ tools: [madeTool("undocumented", "u")] });
      host.tools.register(madeTool("documented", "d"), { kind: "setup", plugin: "p" }, madeDef("documented"));
    },
  };
  const a = agent({ model: testModel(scriptedProvider([textTurn("done")])), instructions: "help", tools: [], use: [p] });
  const events = await collect(a.stream("go"));
  const names = events.filter((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered").map((e) => e.name);
  expect(names).toEqual(["documented"]);
});

test("the host is sealed once setup resolves", async () => {
  let escaped: { register: (f: { tools: AnyTool<unknown>[] }) => void } | undefined;
  const p: Plugin<unknown> = {
    name: "leaky",
    setup: (host) => {
      escaped = host;
    },
  };
  const a = agent({ model: testModel(scriptedProvider([textTurn("done")])), instructions: "help", tools: [], use: [p] });
  await a.run("go");
  expect(() => escaped?.register({ tools: [madeTool("late", "l")] })).toThrow(MithrilError);
  try {
    escaped?.register({ tools: [madeTool("late", "l")] });
  } catch (e) {
    expect((e as MithrilError).code).toBe("HOST_SEALED");
  }
});

test("setup sees deps, which is what makes per-run store selection possible", async () => {
  let seen: unknown;
  const p: Plugin<{ scope: string }> = {
    name: "p",
    setup: (host) => {
      seen = host.deps;
    },
  };
  const a = agent<readonly AnyTool<{ scope: string }>[], { scope: string }>({
    model: testModel(scriptedProvider([textTurn("done")])),
    instructions: "help",
    tools: [],
    use: [p],
  });
  await a.run("go", { deps: { scope: "team-a" } });
  expect(seen).toEqual({ scope: "team-a" });
});

test("a throwing setup fails the run rather than running with fewer tools", async () => {
  const p: Plugin<unknown> = {
    name: "broken",
    setup: () => {
      throw new Error("store unreachable");
    },
  };
  const a = agent({ model: testModel(scriptedProvider([textTurn("done")])), instructions: "help", tools: [], use: [p] });
  const r = await a.run("go");
  expect(r.status).toBe("error");
});

test("two plugins declaring materialize is rejected at agent() time", () => {
  const mk = (name: string): Plugin<unknown> => ({ name, materialize: () => madeTool("x", "x") });
  expect(() =>
    agent({ model: testModel(scriptedProvider([])), instructions: "help", tools: [], use: [mk("a"), mk("b")] }),
  ).toThrow(MithrilError);
});
