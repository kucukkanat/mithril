import { expect, test } from "bun:test";
import type { CodeResult, CodeRunner } from "@mithril/sandbox";
import { workerRunner } from "@mithril/sandbox/worker";
import type { JsonValue } from "@mithril/core/protocol";
import { MithrilError } from "@mithril/core/agent";
import { toolAuthoring } from "../src/index.ts";
import { call, collect, errors, harness, progress, results, say } from "./helpers.ts";

// A deterministic stand-in for a trusted remote sandbox: it declares `isolation: "remote"` so the
// allowLocalRunner gate does not apply, and it runs the code in-process so the test stays fast.
function fakeRemote(impl?: (code: string, globals: Readonly<Record<string, unknown>>) => CodeResult): CodeRunner {
  return {
    isolation: "remote",
    async run(code, opts) {
      const globals = opts?.globals ?? {};
      if (impl !== undefined) return impl(code, globals);
      const logs: string[] = [];
      try {
        const fn = new Function("input", "console", `return ${code}`);
        const value: unknown = await fn(globals["input"], { log: (...a: unknown[]) => logs.push(a.join(" ")) });
        return { ok: true, value: value ?? null, logs };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err), logs };
      }
    },
  };
}

const scriptDef = (source: string, extra: Record<string, JsonValue> = {}): JsonValue => ({
  name: "made",
  description: "a script tool",
  inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } },
  body: { kind: "script", source, ...extra },
});

const open = { requireApprovalToDefine: false } as const;

test("a script body runs and returns its value", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("return input.a + input.b")), call("made", { a: 1, b: 2 }, "c2"), say("done")], {
      ...open,
      script: { runner: fakeRemote() },
    }).stream("go"),
  );
  expect(results(events)[1]).toBe(3);
});

test("a failing body becomes a model-visible tool error, not a crash", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("throw new Error('kaboom')")), call("made", {}, "c2"), say("done")], {
      ...open,
      script: { runner: fakeRemote() },
    }).stream("go"),
  );
  expect(errors(events).some((m) => m.includes("kaboom"))).toBe(true);
});

test("a non-JSON-safe return is rejected rather than silently mangled", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("return () => 1")), call("made", {}, "c2"), say("done")], {
      ...open,
      script: { runner: fakeRemote() },
    }).stream("go"),
  );
  // A tool result has to survive the event log and the message history.
  expect(errors(events).some((m) => m.includes("not JSON-safe"))).toBe(true);
});

test("console output surfaces as progress, not as the result", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("console.log('hi'); return 1")), call("made", {}, "c2"), say("done")], {
      ...open,
      script: { runner: fakeRemote() },
    }).stream("go"),
  );
  expect(progress(events)).toContainEqual({ logs: ["hi"] });
  expect(results(events)[1]).toBe(1);
});

// ── the closed world ──────────────────────────────────────────────────────────────────────────────────

test("the default ambient world has no fetch — the mechanical answer to exfiltration", async () => {
  let seenGlobals: readonly string[] = [];
  const runner = fakeRemote((_code, globals) => {
    seenGlobals = Object.keys(globals);
    return { ok: true, value: null, logs: [] };
  });
  await collect(
    harness([call("define_tool", scriptDef("return 1")), call("made", {}, "c2"), say("done")], { ...open, script: { runner } }).stream("go"),
  );
  expect(seenGlobals).toEqual(["input"]);
});

test("an operator can widen the world explicitly", async () => {
  let seenGlobals: readonly string[] = [];
  const runner = fakeRemote((_code, globals) => {
    seenGlobals = Object.keys(globals).sort();
    return { ok: true, value: null, logs: [] };
  });
  await collect(
    harness([call("define_tool", scriptDef("return 1")), call("made", {}, "c2"), say("done")], {
      ...open,
      script: { runner, globals: () => ({ scopedFetch: true }) },
    }).stream("go"),
  );
  expect(seenGlobals).toEqual(["input", "scopedFetch"]);
});

// ── gates ─────────────────────────────────────────────────────────────────────────────────────────────

test("a local runner is refused at construction unless explicitly accepted", () => {
  const local: CodeRunner = { isolation: "scope", run: async () => ({ ok: true, value: null, logs: [] }) };
  expect(() => toolAuthoring({ script: { runner: local } })).toThrow(MithrilError);
  try {
    toolAuthoring({ script: { runner: local } });
  } catch (e) {
    expect((e as MithrilError).code).toBe("UNSAFE_RUNNER");
    expect((e as MithrilError).message).toContain("allowLocalRunner");
  }
  // …and accepting it deliberately works.
  expect(() => toolAuthoring({ script: { runner: local, allowLocalRunner: true } })).not.toThrow();
});

test("a TypeScript body without a transpiler is rejected at define time, naming the fix", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("return input.a as number", { language: "ts" })), say("done")], {
      ...open,
      script: { runner: fakeRemote() },
    }).stream("go"),
  );
  expect(errors(events)[0]).toContain("transpile");
});

test("a TypeScript body works once a transpiler is supplied", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("return (input.a as number) + 1", { language: "ts" })), call("made", { a: 1 }, "c2"), say("done")], {
      ...open,
      script: { runner: fakeRemote(), transpile: (src) => src.replace(/ as number/g, "") },
    }).stream("go"),
  );
  expect(results(events)[1]).toBe(2);
});

test("script bodies are unavailable unless a runner is configured", async () => {
  const events = await collect(harness([call("define_tool", scriptDef("return 1")), say("done")], open).stream("go"));
  expect(errors(events)[0]).toContain("script body needs");
});

// ── against a real local runner ───────────────────────────────────────────────────────────────────────

test("end-to-end through workerRunner, the runtime-agnostic local backend", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("return input.a * 2")), call("made", { a: 21 }, "c2"), say("done")], {
      ...open,
      script: { runner: workerRunner(), allowLocalRunner: true },
    }).stream("go"),
  );
  expect(results(events)[1]).toBe(42);
});

test("a runaway script is bounded by the worker's deadline", async () => {
  const events = await collect(
    harness([call("define_tool", scriptDef("await new Promise(() => {}); return 1", { timeoutMs: 150 })), call("made", {}, "c2"), say("done")], {
      ...open,
      script: { runner: workerRunner(), allowLocalRunner: true },
    }).stream("go"),
  );
  expect(errors(events).some((m) => m.includes("150ms"))).toBe(true);
});
