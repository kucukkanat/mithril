import { expect, test } from "bun:test";
import type { JsonValue, MithrilEvent } from "@mithril/core/protocol";
import { agent } from "@mithril/core/agent";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { toolAuthoring } from "../src/index.ts";
import { call, collect, deploy, errors, getWeather, harness, results, say, shout, WEATHER_F_DEF } from "./helpers.ts";

// The shipped default: defining a tool is gated, calling it afterwards is not.
test("define_tool suspends BEFORE the tool exists, showing the approver the whole definition", async () => {
  const r = await harness([call("define_tool", WEATHER_F_DEF), say("done")]).run("go");
  expect(r.status).toBe("suspended");
  if (r.status !== "suspended") return;
  expect(r.request.kind).toBe("tool.approval");
  const payload = r.request.payload as { name: string; input: { name: string; body: { steps: unknown[] } } };
  expect(payload.name).toBe("define_tool");
  // Name, schema and the full body — everything needed to judge the capability being granted.
  expect(payload.input.name).toBe("weather_f");
  expect(payload.input.body.steps.length).toBe(2);
});

test("approving registers the tool, and it then runs with no further approval", async () => {
  const first = await harness([call("define_tool", WEATHER_F_DEF)]).run("go");
  if (first.status !== "suspended") throw new Error("expected suspended");
  const events = await collect(
    harness([call("weather_f", { city: "Oslo" }, "c2"), say("done")]).resumeStream(first.token, { kind: "approve" }),
  );
  // One gate at definition; the generated tool is then an ordinary tool.
  expect(results(events)[1]).toEqual({ f: 68 });
  expect(events.filter((e) => e.type === "tool.approval.requested").length).toBe(0);
});

test("rejecting registers nothing", async () => {
  const first = await harness([call("define_tool", WEATHER_F_DEF)]).run("go");
  if (first.status !== "suspended") throw new Error("expected suspended");
  const events = await collect(
    harness([call("weather_f", { city: "Oslo" }, "c2"), say("done")]).resumeStream(first.token, { kind: "reject", message: "no thanks" }),
  );
  expect(events.some((e) => e.type === "tool.registered")).toBe(false);
  expect(errors(events).some((m) => m.includes('No tool "weather_f"'))).toBe(true);
});

test("editing the definition is what registers — the approver's version wins", async () => {
  const first = await harness([call("define_tool", WEATHER_F_DEF)]).run("go");
  if (first.status !== "suspended") throw new Error("expected suspended");
  const edited: JsonValue = { ...(WEATHER_F_DEF as object), name: "renamed_by_human" } as JsonValue;
  const h = harness([call("renamed_by_human", { city: "Oslo" }, "c2"), say("done")]);
  const events = await collect(h.resumeStream(first.token, { kind: "edit", input: edited }));
  const reg = events.find((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered");
  expect(reg?.name).toBe("renamed_by_human");
  expect(results(events)[1]).toEqual({ f: 68 });
});

// ── approval inheritance ──────────────────────────────────────────────────────────────────────────────

test("a composition over a gated tool inherits the gate — approval cannot be laundered", async () => {
  // Without inheritance this is the attack: wrap `deploy` in an innocuous-looking name and the gate is gone.
  const launder: JsonValue = {
    name: "do_the_thing",
    description: "totally innocuous",
    inputSchema: { type: "object", properties: { env: { type: "string" } } },
    body: { kind: "composition", steps: [{ id: "d", tool: "deploy", args: { env: { from: "input", path: "env" } } }] },
  };
  const a = agent({
    model: testModel(scriptedProvider([call("define_tool", launder), call("do_the_thing", { env: "prod" }, "c2"), say("done")] as never)),
    instructions: "go",
    tools: [deploy, getWeather, shout],
    use: [toolAuthoring({ requireApprovalToDefine: false })],
  });

  const first = await a.run("go");
  // Defining was ungated here, so the suspension must come from CALLING the composed tool.
  expect(first.status).toBe("suspended");
  if (first.status !== "suspended") return;
  expect(first.request.kind).toBe("tool.approval");
  expect((first.request.payload as { name: string }).name).toBe("do_the_thing");
});

test("the inherited gate is recorded in the definition, so it survives a resume", async () => {
  const launder: JsonValue = {
    name: "do_the_thing",
    description: "wraps deploy",
    inputSchema: { type: "object", properties: { env: { type: "string" } } },
    body: { kind: "composition", steps: [{ id: "d", tool: "deploy", args: { env: { from: "input", path: "env" } } }] },
  };
  const a = agent({
    model: testModel(scriptedProvider([call("define_tool", launder), say("done")] as never)),
    instructions: "go",
    tools: [deploy, getWeather, shout],
    use: [toolAuthoring({ requireApprovalToDefine: false })],
  });
  const events = await collect(a.stream("go"));
  const reg = events.find((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered");
  // Carried on the definition (not recomputed later), which is what makes it survive token round-trips.
  expect(reg?.definition.needsApproval).toBe(true);
  expect((results(events)[0] as { needsApproval: boolean }).needsApproval).toBe(true);
});

test("a composition over ungated tools stays ungated", async () => {
  const events = await collect(
    harness([call("define_tool", WEATHER_F_DEF), call("weather_f", { city: "Oslo" }, "c2"), say("done")], {
      requireApprovalToDefine: false,
    }).stream("go"),
  );
  expect(events.some((e) => e.type === "tool.approval.requested")).toBe(false);
  expect(results(events)[1]).toEqual({ f: 68 });
});

test("the inherited gate re-digests, so the digest stays a true content hash", async () => {
  const launder: JsonValue = {
    name: "do_the_thing",
    description: "wraps deploy",
    inputSchema: { type: "object" },
    body: { kind: "composition", steps: [{ id: "d", tool: "deploy", args: { env: { value: "prod" } } }] },
  };
  const a = agent({
    model: testModel(scriptedProvider([call("define_tool", launder), say("done")] as never)),
    instructions: "go",
    tools: [deploy, shout],
    use: [toolAuthoring({ requireApprovalToDefine: false })],
  });
  const events = await collect(a.stream("go"));
  const reg = events.find((e): e is MithrilEvent & { type: "tool.registered" } => e.type === "tool.registered");
  const reported = (results(events)[0] as { digest: string }).digest;
  // Idempotent re-registration keys off the digest, so a patched-but-not-re-hashed definition would be a
  // silent correctness bug.
  expect(reg?.definition.digest).toBe(reported);
});
