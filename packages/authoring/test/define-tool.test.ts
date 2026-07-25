import { expect, test } from "bun:test";
import type { MithrilEvent } from "@mithril/core/protocol";
import { toJsonSchema } from "@mithril/core/protocol";
import { toolAuthoring } from "../src/index.ts";
import { call, collect, errors, harness, results, say, WEATHER_F_DEF } from "./helpers.ts";

// Approval is the shipped default; these tests are about the definition mechanics, so they opt out. See
// approval.test.ts for the gate itself.
const open = { requireApprovalToDefine: false } as const;

test("a tool is defined on one turn and callable on the next", async () => {
  const events = await collect(
    harness([call("define_tool", WEATHER_F_DEF), call("weather_f", { city: "Oslo" }, "c2"), say("done")], open).stream("go"),
  );
  const out = results(events);
  expect((out[0] as { name: string; availableFromStep: number }).name).toBe("weather_f");
  expect((out[0] as { availableFromStep: number }).availableFromStep).toBe(1);
  expect(out[1]).toEqual({ f: 68 }); // 20°C through get_weather → c_to_f
});

test("the registration is on the event stream and folds into RunState", async () => {
  const h = harness([call("define_tool", WEATHER_F_DEF), say("done")], open).stream("go");
  const events = await collect(h);
  const reg = events.find((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered");
  expect(reg?.name).toBe("weather_f");
  expect(reg?.provenance).toEqual({ kind: "runtime", by: "define_tool", callId: "c1" });
  expect(Object.keys(h.state().tools ?? {})).toEqual(["weather_f"]);
});

test("list_tools reports authored tools only", async () => {
  const events = await collect(
    harness([call("define_tool", WEATHER_F_DEF), call("list_tools", {}, "c2"), say("done")], open).stream("go"),
  );
  // Static tools are already in the model's tool list; echoing them back would only burn tokens.
  expect(results(events)[1]).toEqual([{ name: "weather_f", description: "weather in fahrenheit", needsApproval: false }]);
});

test("revoke_tool removes an authored tool, and a later call to it is unknown", async () => {
  const events = await collect(
    harness(
      [call("define_tool", WEATHER_F_DEF), call("revoke_tool", { name: "weather_f" }, "c2"), call("weather_f", { city: "Oslo" }, "c3"), say("done")],
      open,
    ).stream("go"),
  );
  expect(results(events)[1]).toEqual({ revoked: true });
  expect(errors(events).some((m) => m.includes('No tool "weather_f"'))).toBe(true);
});

test("revoke_tool refuses an author-declared tool, as information rather than a crash", async () => {
  const events = await collect(harness([call("revoke_tool", { name: "get_weather" }), say("done")], open).stream("go"));
  const r = results(events)[0] as { revoked: boolean; reason?: string };
  expect(r.revoked).toBe(false);
  expect(r.reason).toContain("declared by the agent's author");
});

test("revoking a name that does not exist is reported, not thrown", async () => {
  const events = await collect(harness([call("revoke_tool", { name: "nope" }), say("done")], open).stream("go"));
  expect(results(events)[0]).toEqual({ revoked: false, reason: 'no tool named "nope"' });
});

// ── rejected definitions ──────────────────────────────────────────────────────────────────────────────

test("a name colliding with a static tool is rejected and the original survives", async () => {
  const events = await collect(
    harness(
      [call("define_tool", { ...(WEATHER_F_DEF as object), name: "get_weather" }), call("get_weather", { city: "Oslo" }, "c2"), say("done")],
      open,
    ).stream("go"),
  );
  expect(errors(events)[0]).toContain("already exists");
  expect(results(events)[0]).toEqual({ city: "Oslo", tempC: 20 });
});

test("a reserved meta-tool name is rejected", async () => {
  const events = await collect(
    harness([call("define_tool", { ...(WEATHER_F_DEF as object), name: "define_tool" }), say("done")], open).stream("go"),
  );
  expect(errors(events)[0]).toContain("reserved");
});

test("a malformed wire name is rejected with the rule stated", async () => {
  const events = await collect(
    harness([call("define_tool", { ...(WEATHER_F_DEF as object), name: "Weather F!" }), say("done")], open).stream("go"),
  );
  expect(errors(events)[0]).toContain("lowercase letters, digits and underscores");
});

test("an unusable inputSchema is rejected at define time, with the schema's own message", async () => {
  const events = await collect(
    harness([call("define_tool", { ...(WEATHER_F_DEF as object), inputSchema: { oneOf: [{ type: "string" }] } }), say("done")], open).stream("go"),
  );
  // Better here, where the model can fix it, than as a mystery at call time.
  expect(errors(events)[0]).toContain("inputSchema is not usable");
  expect(errors(events)[0]).toContain("oneOf");
});

test("a definition missing required fields fails input validation", async () => {
  const events = await collect(harness([call("define_tool", { name: "x" }), say("done")], open).stream("go"));
  expect(errors(events)[0]).toContain("description");
});

test("the maxTools cap is enforced and explains how to proceed", async () => {
  const def = (n: string) => ({
    name: n,
    description: "d",
    inputSchema: { type: "object" },
    body: { kind: "composition", steps: [{ id: "s", tool: "shout", args: { text: { value: "hi" } } }] },
  });
  const events = await collect(
    harness([call("define_tool", def("one")), call("define_tool", def("two"), "c2"), say("done")], { ...open, maxTools: 1 }).stream("go"),
  );
  expect(errors(events)[0]).toContain("the limit is 1");
  expect(errors(events)[0]).toContain("revoke");
});

test("define_tool ships few-shot examples, which is how the model learns the body format", async () => {
  // The loop's `withExamples` folds a tool's `examples` into its wire description at the model boundary,
  // for every provider. That is the whole mechanism by which the model learns the composition shape — no
  // prompt engineering — so assert the examples are actually attached and describe a composition.
  const plugin = toolAuthoring();
  const def = plugin.tools?.find((t) => t.name === "define_tool");
  expect(def?.examples?.length).toBeGreaterThan(0);
  const first = def?.examples?.[0] as { body?: { kind?: string; steps?: unknown[] } };
  expect(first.body?.kind).toBe("composition");
  expect(Array.isArray(first.body?.steps)).toBe(true);
  // …and the input schema is self-describing, so the model is told the real shape rather than prose.
  const advertised = toJsonSchema(def?.inputSchema as never) as { required?: string[] };
  expect(advertised.required).toEqual(["name", "description", "inputSchema", "body"]);
});
