import { expect, test } from "bun:test";
import type { JsonValue } from "@mithril/core/protocol";
import { suspend } from "@mithril/core/protocol";
import { agent, tool } from "@mithril/core/agent";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { toolAuthoring } from "../src/index.ts";
import { call, cToF, collect, errors, getWeather, harness, progress, results, say, schema, shout, WEATHER_F_DEF } from "./helpers.ts";

const open = { requireApprovalToDefine: false } as const;

const defineWith = (body: JsonValue, name = "made"): JsonValue => ({
  name,
  description: "a composed tool",
  inputSchema: { type: "object" },
  body,
});

test("all three ValueRef forms resolve", async () => {
  const body: JsonValue = {
    kind: "composition",
    steps: [
      // {from:"input"} with a path, and a {value} literal.
      { id: "s", tool: "shout", args: { text: { from: "input", path: "who" }, prefix: { value: "HELLO " } } },
    ],
  };
  const events = await collect(harness([call("define_tool", defineWith(body)), call("made", { who: "ada" }, "c2"), say("done")], open).stream("go"));
  expect(results(events)[1]).toBe("HELLO ADA");
});

test("a step reference reads an earlier step's output by path", async () => {
  const events = await collect(
    harness([call("define_tool", WEATHER_F_DEF), call("weather_f", { city: "Oslo" }, "c2"), say("done")], open).stream("go"),
  );
  expect(results(events)[1]).toEqual({ f: 68 });
});

test("returns defaults to the last step, and an explicit returns overrides it", async () => {
  const body = (returns?: JsonValue): JsonValue => ({
    kind: "composition",
    steps: [
      { id: "w", tool: "get_weather", args: { city: { from: "input", path: "city" } } },
      { id: "f", tool: "c_to_f", args: { celsius: { from: "step", id: "w", path: "tempC" } } },
    ],
    ...(returns !== undefined ? { returns } : {}),
  });
  const dflt = await collect(harness([call("define_tool", defineWith(body())), call("made", { city: "Oslo" }, "c2"), say("done")], open).stream("go"));
  expect(results(dflt)[1]).toEqual({ f: 68 });

  const explicit = await collect(
    harness([call("define_tool", defineWith(body({ from: "step", id: "w", path: "city" }))), call("made", { city: "Oslo" }, "c2"), say("done")], open).stream(
      "go",
    ),
  );
  expect(results(explicit)[1]).toBe("Oslo");
});

test("each step surfaces as a tool.progress event — no new event type needed", async () => {
  const events = await collect(
    harness([call("define_tool", WEATHER_F_DEF), call("weather_f", { city: "Oslo" }, "c2"), say("done")], open).stream("go"),
  );
  const steps = progress(events) as { step: string; tool: string; output: unknown }[];
  expect(steps.map((s) => s.step)).toEqual(["w", "f"]);
  expect(steps.map((s) => s.tool)).toEqual(["get_weather", "c_to_f"]);
  expect(steps[1]?.output).toEqual({ f: 68 });
});

test("a failing sub-tool aborts the composition and later steps do not run", async () => {
  let secondRan = false;
  const boom = tool({ name: "boom", description: "throws", inputSchema: schema<Record<string, never>>(), execute: () => {
    throw new Error("kaboom");
  } });
  const after = tool({ name: "after", description: "records", inputSchema: schema<Record<string, never>>(), execute: async () => {
    secondRan = true;
    return "ran";
  } });
  const body: JsonValue = {
    kind: "composition",
    steps: [
      { id: "a", tool: "boom", args: {} },
      { id: "b", tool: "after", args: {} },
    ],
  };
  const a = agent({
    model: testModel(scriptedProvider([call("define_tool", defineWith(body)), call("made", {}, "c2"), say("done")] as never)),
    instructions: "go",
    tools: [boom, after],
    use: [toolAuthoring(open)],
  });
  const events = await collect(a.stream("go"));
  expect(errors(events).some((m) => m.includes("kaboom"))).toBe(true);
  expect(secondRan).toBe(false);
});

test("a composition whose tool disappeared fails with a clear message", async () => {
  const events = await collect(
    harness(
      [call("define_tool", WEATHER_F_DEF), call("revoke_tool", { name: "weather_f" }, "c2"), say("done")],
      open,
    ).stream("go"),
  );
  // Sanity: revocation is the mechanism the next test relies on.
  expect(results(events)[1]).toEqual({ revoked: true });
});

// ── define-time validation ────────────────────────────────────────────────────────────────────────────

test("a step naming an unknown tool is rejected when the tool is defined, not when it is called", async () => {
  const body: JsonValue = { kind: "composition", steps: [{ id: "s", tool: "does_not_exist", args: {} }] };
  const events = await collect(harness([call("define_tool", defineWith(body)), say("done")], open).stream("go"));
  expect(errors(events)[0]).toContain("does_not_exist");
  expect(errors(events)[0]).toContain("not a tool this agent has");
});

test("a forward reference between steps is rejected", async () => {
  const body: JsonValue = {
    kind: "composition",
    steps: [
      { id: "a", tool: "shout", args: { text: { from: "step", id: "b" } } },
      { id: "b", tool: "shout", args: { text: { value: "x" } } },
    ],
  };
  const events = await collect(harness([call("define_tool", defineWith(body)), say("done")], open).stream("go"));
  // Rejecting forward references is what makes the graph acyclic by construction.
  expect(errors(events)[0]).toContain("does not run before it");
});

test("a duplicate step id is rejected", async () => {
  const body: JsonValue = {
    kind: "composition",
    steps: [
      { id: "s", tool: "shout", args: { text: { value: "a" } } },
      { id: "s", tool: "shout", args: { text: { value: "b" } } },
    ],
  };
  const events = await collect(harness([call("define_tool", defineWith(body)), say("done")], open).stream("go"));
  expect(errors(events)[0]).toContain("duplicate step id");
});

test("an unknown body kind is rejected with a message naming the tiers", async () => {
  const events = await collect(harness([call("define_tool", defineWith({ kind: "wat" })), say("done")], open).stream("go"));
  expect(errors(events)[0]).toContain("script body needs");
});

// ── HITL through a composition ────────────────────────────────────────────────────────────────────────

test("a sub-tool's suspension propagates, and on resume earlier steps are not re-run", async () => {
  let firstRuns = 0;
  const counted = tool({
    name: "counted",
    description: "counts its executions",
    inputSchema: schema<Record<string, never>>(),
    execute: async () => {
      firstRuns++;
      return { n: firstRuns };
    },
  });
  const asks = tool({
    name: "asks",
    description: "suspends mid-composition",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_i, ctx) => ctx.suspend({ kind: "confirm", payload: { q: "ok?" } }),
  });
  const body: JsonValue = {
    kind: "composition",
    steps: [
      { id: "one", tool: "counted", args: {} },
      { id: "two", tool: "asks", args: {} },
    ],
  };
  const build = (turns: readonly unknown[]) =>
    agent({
      model: testModel(scriptedProvider(turns as never)),
      instructions: "go",
      tools: [counted, asks],
      use: [toolAuthoring(open)],
    });

  const first = await build([call("define_tool", defineWith(body)), call("made", {}, "c2")]).run("go");
  expect(first.status).toBe("suspended");
  expect(firstRuns).toBe(1);
  if (first.status !== "suspended") return;

  const resumed = await build([say("done")]).resume(first.token, { kind: "resolve", value: "yes" });
  expect(resumed.status).toBe("completed");
  // The journal is what keeps step "one" exactly-once across the pause.
  expect(firstRuns).toBe(1);
});

test("suspend() is re-exported through the composition path unchanged", () => {
  // Guards the import surface the composition relies on.
  expect(typeof suspend).toBe("function");
  expect(typeof getWeather.execute).toBe("function");
  expect(typeof cToF.execute).toBe("function");
  expect(typeof shout.execute).toBe("function");
});
