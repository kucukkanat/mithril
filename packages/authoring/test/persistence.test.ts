import { expect, test } from "bun:test";
import { memoryFileSystem } from "@mithril/fs";
import { memoryKv } from "@mithril/kv";
import type { MithrilEvent } from "@mithril/core/protocol";
import { agent } from "@mithril/core/agent";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { fsToolStore, kvToolStore, toolStoreConformance, type ToolStore } from "../src/persistence.ts";
import { toolAuthoring } from "../src/index.ts";
import { call, cToF, collect, errors, getWeather, results, say, shout, WEATHER_F_DEF } from "./helpers.ts";

const adapter = { test, assertEqual: (a: unknown, b: unknown) => expect(a).toEqual(b) };

// The repo's conformance-kit convention: one shared suite, run against every backend.
toolStoreConformance(async () => kvToolStore(memoryKv()), adapter);
toolStoreConformance(async () => fsToolStore(memoryFileSystem()), adapter);

test("the kv store keeps its index consistent across save and remove", async () => {
  // kv cannot enumerate, so the index is the store's own bookkeeping — worth asserting directly.
  const kv = memoryKv();
  const store = kvToolStore(kv);
  const def = { name: "alpha", description: "d", inputSchema: { type: "object" }, body: null, digest: "x" };
  await store.save("s", def);
  expect(await kv.get("mithril:tools:v1:s:__index")).toEqual(["alpha"]);
  await store.save("s", def); // saving twice must not duplicate the index entry
  expect(await kv.get("mithril:tools:v1:s:__index")).toEqual(["alpha"]);
  await store.remove("s", "alpha");
  expect(await kv.get("mithril:tools:v1:s:__index")).toEqual([]);
  expect(await kv.get("mithril:tools:v1:s:t:alpha")).toBeUndefined();
});

test("the fs store lays tools out as reviewable JSON files", async () => {
  const fs = memoryFileSystem();
  const store = fsToolStore(fs, { dir: "tools" });
  await store.save("team-a", { name: "alpha", description: "d", inputSchema: { type: "object" }, body: null, digest: "x" });
  expect(await fs.exists("tools/team-a/alpha.json")).toBe(true);
  expect(JSON.parse(await fs.readText("tools/team-a/alpha.json"))).toMatchObject({ name: "alpha" });
});

// ── across runs ───────────────────────────────────────────────────────────────────────────────────────

function build(store: ToolStore, turns: readonly unknown[], scope = "team-a") {
  return agent({
    model: testModel(scriptedProvider(turns as never)),
    instructions: "go",
    tools: [getWeather, cToF, shout],
    use: [toolAuthoring({ requireApprovalToDefine: false, store, scope })],
  });
}

test("a tool defined in one run is advertised at step 0 of the next", async () => {
  const store = kvToolStore(memoryKv());
  await collect(build(store, [call("define_tool", WEATHER_F_DEF), say("done")]).stream("go"));

  // A brand-new agent: only the store carries the tool over.
  const seen: string[][] = [];
  const second = agent({
    model: testModel(scriptedProvider([call("weather_f", { city: "Oslo" }, "c1"), say("done")] as never)),
    instructions: "go",
    tools: [getWeather, cToF, shout],
    use: [
      toolAuthoring({ requireApprovalToDefine: false, store, scope: "team-a" }),
      { name: "spy", model: async (_c, callArgs, next) => (seen.push(callArgs.tools.map((t) => t.name)), next(callArgs)) },
    ],
  });
  const events = await collect(second.stream("go"));
  expect(seen[0]).toContain("weather_f"); // available from the FIRST model call, not the second
  expect(results(events)[0]).toEqual({ f: 68 });
});

test("revoking removes it from the store, so the next run does not reload it", async () => {
  const store = kvToolStore(memoryKv());
  await collect(build(store, [call("define_tool", WEATHER_F_DEF), call("revoke_tool", { name: "weather_f" }, "c2"), say("done")]).stream("go"));
  expect(await store.load("team-a")).toEqual([]);

  const events = await collect(build(store, [call("weather_f", { city: "Oslo" }), say("done")]).stream("go"));
  expect(errors(events).some((m) => m.includes('No tool "weather_f"'))).toBe(true);
});

test("scopes are isolated between agents", async () => {
  const store = kvToolStore(memoryKv());
  await collect(build(store, [call("define_tool", WEATHER_F_DEF), say("done")], "team-a").stream("go"));
  const events = await collect(build(store, [call("weather_f", { city: "Oslo" }), say("done")], "team-b").stream("go"));
  expect(errors(events).some((m) => m.includes('No tool "weather_f"'))).toBe(true);
});

test("a stored tool that no longer builds is skipped, not fatal", async () => {
  const store = kvToolStore(memoryKv());
  // Defined against an agent that has `shout`…
  await collect(
    build(store, [
      call("define_tool", {
        name: "loud",
        description: "shouts",
        inputSchema: { type: "object" },
        body: { kind: "composition", steps: [{ id: "s", tool: "shout", args: { text: { value: "hi" } } }] },
      }),
      say("done"),
    ]).stream("go"),
  );
  expect((await store.load("team-a")).length).toBe(1);

  // …then loaded by an agent that no longer has it. A stale cache entry must not stop the run starting.
  const narrowed = agent({
    model: testModel(scriptedProvider([say("done")] as never)),
    instructions: "go",
    tools: [getWeather],
    use: [toolAuthoring({ requireApprovalToDefine: false, store, scope: "team-a" })],
  });
  const events = await collect(narrowed.stream("go"));
  const skipped = events.find((e): e is MithrilEvent & { type: `custom.${string}` } => e.type === "custom.mithril.authoring.skipped");
  expect((skipped?.payload as { name: string }).name).toBe("loud");
  // Reported as custom, never `tool.revoked` — it never entered the registry, so the fold must not see it.
  expect(events.some((e) => e.type === "tool.revoked")).toBe(false);
});

test("a store without a scope is refused rather than sharing a default namespace", async () => {
  const a = agent({
    model: testModel(scriptedProvider([call("define_tool", WEATHER_F_DEF), say("done")] as never)),
    instructions: "go",
    tools: [getWeather, cToF, shout],
    use: [toolAuthoring({ requireApprovalToDefine: false, store: kvToolStore(memoryKv()) })],
  });
  const r = await a.run("go");
  expect(r.status).toBe("error"); // surfaced from setup, which fails the run rather than running unscoped
});

test("the store and scope can be chosen per run from deps, for multi-tenant hosts", async () => {
  const store = kvToolStore(memoryKv());
  const make = (turns: readonly unknown[]) =>
    agent<never, { tenant: string }>({
      model: testModel(scriptedProvider(turns as never)),
      instructions: "go",
      tools: [getWeather, cToF, shout] as never,
      use: [
        toolAuthoring({
          requireApprovalToDefine: false,
          store,
          // This is what `PluginHost.deps` exists for — a static `Plugin.tools` array could not do it.
          scope: (ctx) => (ctx.deps as { tenant: string }).tenant,
        }),
      ],
    });
  await collect(make([call("define_tool", WEATHER_F_DEF), say("done")]).stream("go", { deps: { tenant: "acme" } }));
  expect((await store.load("acme")).map((d) => d.name)).toEqual(["weather_f"]);
  expect(await store.load("other")).toEqual([]);
});
