import { describe, expect, test } from "bun:test";
import type { MithrilEvent, SpanRef } from "@mithril/core/protocol";
import type { ToolSpec } from "@mithril/spec";
import { classifyProbe, probeKey, probeProgram, reachesOutside, syntheticInputs } from "../src/lib/probe.ts";

/*
 * The probe exists because of one concrete event: a tool whose body was a ReferenceError scored 90/100 and
 * showed "1 of 1 input read". Every state below is anchored to a real tool from that project.
 */

const SPAN: SpanRef = { id: "s", parentId: null, traceId: "t", kind: "execute_tool" };
const meta = (seq: number): Omit<MithrilEvent, "type"> & Record<string, unknown> =>
  ({ v: 1, runId: "r", seq, ts: seq, span: SPAN }) as never;

const toolOf = (over: Partial<ToolSpec>): ToolSpec =>
  ({
    kind: "tool",
    id: "t1",
    name: "retrieve_notes",
    description: "d",
    inputSchema: { zod: "z.object({ personName: z.string() })" },
    execute: { code: "async ({ personName }) => ({ notes: personName })" },
    ...over,
  }) as ToolSpec;

const result = (seq: number, output: unknown): MithrilEvent => ({ ...meta(seq), type: "tool.result", callId: `c${seq}`, output, ms: 1 }) as MithrilEvent;
const failure = (seq: number, message: string): MithrilEvent =>
  ({ ...meta(seq), type: "tool.error", callId: `c${seq}`, error: { name: "Error", message, classification: "unknown", retryable: false } }) as MithrilEvent;

describe("syntheticInputs", () => {
  test("every field differs between the two trials, so ignored input is observable", () => {
    const [a, b] = syntheticInputs("z.object({ city: z.string(), days: z.number(), exact: z.boolean() })");
    expect(a).toEqual({ city: "probe-alpha", days: 1, exact: true });
    expect(b).toEqual({ city: "probe-beta", days: 2, exact: false });
  });

  test("a zero-field schema yields two empty objects", () => {
    expect(syntheticInputs("z.object({})")).toEqual([{}, {}]);
  });
});

describe("reachesOutside — the consent gate", () => {
  test("a self-contained scaffold is safe to run automatically", () => {
    expect(reachesOutside('async () => ({ events: [{ title: "Weekly sync" }] })')).toBeNull();
  });

  test.each([
    ["async () => (await fetch(url)).json()", "makes a network request"],
    ["async () => { localStorage.setItem('k','v'); return {}; }", "writes browser storage"],
    ["async () => { const m = await import('./x.js'); return m.go(); }", "loads code dynamically"],
  ])("%s needs an explicit click", (code, capability) => {
    expect(reachesOutside(code)?.capability).toBe(capability);
  });
});

describe("classifyProbe", () => {
  test("the real bug: a free variable in the body reports the literal ReferenceError", () => {
    // The exact body that scored 90/100 and rendered "1 of 1 input read".
    const broken = toolOf({ execute: { code: "async ({ input }) => ({ echoed: `${personName} is a nice person` })" } });
    const r = classifyProbe(broken, [failure(1, "personName is not defined")]);
    expect(r.state).toBe("broken");
    expect(r.detail).toContain("retrieve_notes threw");
    expect(r.detail).toContain("personName is not defined");
  });

  test("an unedited scaffold reads as a stub, not as working", () => {
    const stub = toolOf({ execute: { code: "async () => {\n  // TODO: call your real API here.\n  return { ok: true };\n}" } });
    const r = classifyProbe(stub, [result(1, { ok: true }), result(2, { ok: true })]);
    expect(r.state).toBe("stub");
    expect(r.headline).toBe("still a stub");
  });

  test("same output for two different inputs is reported as ignoring its input", () => {
    const r = classifyProbe(toolOf({}), [result(1, { notes: "constant" }), result(2, { notes: "constant" })]);
    expect(r.state).toBe("stub");
    expect(r.headline).toBe("ignores its input");
  });

  test("a zero-field tool returning the same thing twice is NOT accused of ignoring input", () => {
    // Nothing varied, so there is no evidence either way — claiming otherwise would be a false red.
    const noArgs = toolOf({ inputSchema: { zod: "z.object({})" }, execute: { code: "async () => ({ events: [1] })" } });
    const r = classifyProbe(noArgs, [result(1, { events: [1] }), result(2, { events: [1] })]);
    expect(r.state).toBe("ok");
  });

  test("empty returns are called out — the model gets no data", () => {
    for (const empty of [{}, [], null, ""]) {
      expect(classifyProbe(toolOf({}), [result(1, empty), result(2, empty)]).state).toBe("empty");
    }
  });

  test("a body that reads its input and varies passes", () => {
    const r = classifyProbe(toolOf({}), [result(1, { notes: "probe-alpha" }), result(2, { notes: "probe-beta" })]);
    expect(r.state).toBe("ok");
    expect(r.detail).toContain("probe-alpha");
  });

  test("no result and no error is broken, not silently fine", () => {
    expect(classifyProbe(toolOf({}), []).state).toBe("broken");
  });

  test("a throw outranks the scaffold marker — the fact beats the heuristic", () => {
    const both = toolOf({ execute: { code: "async () => {\n  // TODO: call your real API here.\n  return boom;\n}" } });
    expect(classifyProbe(both, [failure(1, "boom is not defined")]).state).toBe("broken");
  });
});

describe("probeProgram", () => {
  const program = probeProgram(toolOf({}));

  test("drives the real loop through the testkit, with no provider or key", () => {
    expect(program).toContain('from "@mithril/core/testkit"');
    expect(program).toContain("scriptedProvider");
    expect(program).not.toContain("apiKey");
    expect(program).not.toContain("process.env");
  });

  test("calls the tool twice with the two differing inputs", () => {
    expect(program).toContain('toolCallTurn("retrieve_notes", {"personName":"probe-alpha"}');
    expect(program).toContain('toolCallTurn("retrieve_notes", {"personName":"probe-beta"}');
  });

  test("emits the identical tool source a real run compiles", () => {
    expect(program).toContain("const t1 = tool({");
    expect(program).toContain("async ({ personName }) => ({ notes: personName })");
  });

  test("drops needsApproval, which would suspend the probe forever", () => {
    const gated = probeProgram(toolOf({ needsApproval: true }));
    expect(gated).not.toContain("needsApproval");
  });
});

describe("probeKey", () => {
  test("changes when the body or schema changes", () => {
    const base = toolOf({});
    expect(probeKey(base)).not.toBe(probeKey(toolOf({ execute: { code: "async () => ({ other: 1 })" } })));
    expect(probeKey(base)).not.toBe(probeKey(toolOf({ inputSchema: { zod: "z.object({})" } })));
  });

  test("survives a rename or a reworded description — neither can change what the body does", () => {
    const base = toolOf({});
    expect(probeKey(toolOf({ name: "renamed", description: "totally rewritten" }))).toBe(probeKey(base));
  });
});
