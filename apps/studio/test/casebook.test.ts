import { describe, expect, test } from "bun:test";
import type { MithrilEvent } from "@mithril/core/protocol";
import { describeShape, gradeCase, healthOf, matchesBaseline, shapeOf, type Case, type RunShape } from "../src/lib/casebook.ts";

// Minimal well-formed events — only the fields the shape reducer reads, plus the envelope.
let seq = 0;
const span = { id: "s1", parentId: null, traceId: "t1", kind: "invoke_agent" as const };
const ev = <T extends MithrilEvent["type"]>(type: T, rest: Record<string, unknown> = {}, ts = ++seq): MithrilEvent =>
  ({ v: 1, runId: "r1", seq: ++seq, ts, span, type, ...rest }) as unknown as MithrilEvent;

const textRun = (text: string): MithrilEvent[] => [
  ev("run.start", { input: "hi", model: "m", depsDigest: "d" }, 0),
  ev("step.start", { step: 1 }, 1),
  ev("text.delta", { delta: text }, 2),
  ev("run.finish", { reason: "stop", usage: {} }, 100),
];

const toolRun = (name: string, text: string): MithrilEvent[] => [
  ev("run.start", { input: "hi", model: "m", depsDigest: "d" }, 0),
  ev("step.start", { step: 1 }, 1),
  ev("tool.call", { callId: "c1", name, input: {} }, 2),
  ev("tool.result", { callId: "c1", output: {}, ms: 5 }, 3),
  ev("step.start", { step: 2 }, 4),
  ev("text.delta", { delta: text }, 5),
  ev("run.finish", { reason: "stop", usage: {} }, 200),
];

const aCase = (over: Partial<Case> = {}): Case => ({
  id: "c1",
  input: "What's the weather in Istanbul?",
  baseline: null,
  last: null,
  checkedAt: null,
  ...over,
});

describe("shapeOf", () => {
  test("records tool calls in order, deduplicated", () => {
    const events = [...toolRun("weather", "21C."), ev("tool.call", { callId: "c2", name: "weather", input: {} })];
    expect(shapeOf(events).tools).toEqual(["weather"]);
  });

  test("an answer with no tool call is visible as such", () => {
    const shape = shapeOf(textRun("Istanbul is usually around 28C."));
    expect(shape.tools).toEqual([]);
    expect(shape.replyLength).toBe("one-sentence");
  });

  test("counts steps and measures elapsed time from the envelope", () => {
    const shape = shapeOf(toolRun("weather", "21C."));
    expect(shape.steps).toBe(2);
    expect(shape.ms).toBe(200);
  });

  test("buckets reply length by sentence count", () => {
    expect(shapeOf(textRun("")).replyLength).toBe("empty");
    expect(shapeOf(textRun("One sentence.")).replyLength).toBe("one-sentence");
    expect(shapeOf(textRun("One. Two. Three.")).replyLength).toBe("short");
    expect(shapeOf(textRun("One. Two. Three. Four. Five.")).replyLength).toBe("long");
  });

  test("streamed deltas are concatenated before bucketing", () => {
    const events = [ev("text.delta", { delta: "Half " }, 1), ev("text.delta", { delta: "a sentence." }, 2)];
    expect(shapeOf(events).replyLength).toBe("one-sentence");
  });

  test("handoffs, suspension and structured output all land in the shape", () => {
    const events = [
      ev("handoff", { callId: "h1", to: "researcher", input: {} }),
      ev("suspend", { descriptor: {} }),
      ev("object.final", { value: { ok: true } }),
    ];
    const shape = shapeOf(events);
    expect(shape.handoffs).toEqual(["researcher"]);
    expect(shape.suspended).toBe(true);
    expect(shape.producedObject).toBe(true);
  });

  test("an error is recorded from run.error, tool.error, or a failed finish", () => {
    expect(shapeOf([ev("run.error", { error: { message: "boom" } })]).errored).toBe(true);
    expect(shapeOf([ev("tool.error", { callId: "c1", error: { message: "boom" } })]).errored).toBe(true);
    expect(shapeOf([ev("run.finish", { reason: "error", usage: {} })]).errored).toBe(true);
    expect(shapeOf(textRun("fine.")).errored).toBe(false);
  });

  test("an unknown event type is ignored rather than throwing (the union is open)", () => {
    const events = [...textRun("ok."), ev("custom.something" as "text.delta", { payload: 1 })];
    expect(() => shapeOf(events)).not.toThrow();
    expect(shapeOf(events).replyLength).toBe("one-sentence");
  });

  test("an empty stream yields a zeroed shape", () => {
    expect(shapeOf([])).toEqual({
      tools: [],
      handoffs: [],
      errored: false,
      suspended: false,
      producedObject: false,
      replyLength: "empty",
      steps: 0,
      ms: 0,
    });
  });
});

describe("describeShape", () => {
  test("phrases a tool-using baseline as an expectation", () => {
    expect(describeShape(shapeOf(toolRun("weather", "21C.")))).toBe("calls weather, answers in one sentence");
  });

  test("says so explicitly when no tool was used", () => {
    expect(describeShape(shapeOf(textRun("Hello there.")))).toBe("answers without a tool, answers in one sentence");
  });

  test("joins several tools readably", () => {
    const shape: RunShape = { ...shapeOf([]), tools: ["a", "b", "c"] };
    expect(describeShape(shape)).toContain("calls a, b and c");
  });

  test("mentions handoff, approval and structured output", () => {
    const shape: RunShape = { ...shapeOf([]), handoffs: ["researcher"], suspended: true, producedObject: true };
    const text = describeShape(shape);
    expect(text).toContain("hands off to researcher");
    expect(text).toContain("stops for approval");
    expect(text).toContain("returns a valid object");
  });
});

describe("gradeCase", () => {
  const baseline = shapeOf(toolRun("weather", "It is 21C in Istanbul."));

  test("a case that has never run is unreviewed, not failing", () => {
    expect(gradeCase(aCase(), 0).verdict).toBe("unreviewed");
  });

  test("a run with no accepted baseline stays unreviewed and states the facts", () => {
    const r = gradeCase(aCase({ last: baseline, checkedAt: 10 }), 0);
    expect(r.verdict).toBe("unreviewed");
    expect(r.why).toContain("Accept it as correct");
  });

  test("an identical re-check passes", () => {
    const r = gradeCase(aCase({ baseline, last: shapeOf(toolRun("weather", "It is 21C in Istanbul.")), checkedAt: 10 }), 0);
    expect(r.verdict).toBe("pass");
    expect(r.expects).toBe("calls weather, answers in one sentence");
  });

  test("wording changes alone do not fail a case", () => {
    const reworded = shapeOf(toolRun("weather", "Currently 22C over there."));
    expect(gradeCase(aCase({ baseline, last: reworded, checkedAt: 10 }), 0).verdict).toBe("pass");
  });

  test("dropping the tool call fails, and names the design's actual cause", () => {
    const noTool = shapeOf(textRun("Istanbul is usually around 28C."));
    const r = gradeCase(aCase({ baseline, last: noTool, checkedAt: 10 }), 0);
    expect(r.verdict).toBe("fail");
    expect(r.why).toContain("never called weather");
    expect(r.why).toContain("answered from memory");
  });

  test("a newly erroring run fails and leads with the error", () => {
    const broken = shapeOf([...toolRun("weather", "x."), ev("run.error", { error: { message: "boom" } })]);
    const r = gradeCase(aCase({ baseline, last: broken, checkedAt: 10 }), 0);
    expect(r.verdict).toBe("fail");
    expect(r.why.toLowerCase()).toContain("now errors");
  });

  test("an added tool call is a divergence too", () => {
    const extra = shapeOf([...toolRun("weather", "x."), ev("tool.call", { callId: "c9", name: "search", input: {} })]);
    expect(gradeCase(aCase({ baseline, last: extra, checkedAt: 10 }), 0).why).toContain("now also calls search");
  });

  test("a lost handoff is reported", () => {
    const withHandoff: RunShape = { ...baseline, handoffs: ["researcher"] };
    const r = gradeCase(aCase({ baseline: withHandoff, last: baseline, checkedAt: 10 }), 0);
    expect(r.verdict).toBe("fail");
    expect(r.why).toContain("stopped handing off to researcher");
  });

  test("several divergences are listed in one sentence", () => {
    const worse = shapeOf(textRun("A. B. C. D. E."));
    const r = gradeCase(aCase({ baseline, last: worse, checkedAt: 10 }), 0);
    expect(r.verdict).toBe("fail");
    expect(r.why).toContain(", and ");
  });

  test("a run older than the last spec edit is stale, never a pass or a fail", () => {
    const r = gradeCase(aCase({ baseline, last: baseline, checkedAt: 5 }), 10);
    expect(r.verdict).toBe("stale");
    expect(r.why).toContain("re-check");
  });

  test("staleness outranks divergence — an outdated fail is not reported as a fail", () => {
    const noTool = shapeOf(textRun("From memory."));
    expect(gradeCase(aCase({ baseline, last: noTool, checkedAt: 5 }), 10).verdict).toBe("stale");
  });

  test("why is always a capitalised single sentence", () => {
    const noTool = shapeOf(textRun("From memory."));
    const { why } = gradeCase(aCase({ baseline, last: noTool, checkedAt: 10 }), 0);
    expect(why[0]).toBe(why[0]?.toUpperCase());
    expect(why.endsWith(".")).toBe(true);
  });
});

describe("matchesBaseline", () => {
  const baseline = shapeOf(toolRun("weather", "It is 21C."));

  test("agrees with gradeCase — it is the single authority on pass/fail", () => {
    const same = shapeOf(toolRun("weather", "Totally different wording."));
    const diverged = shapeOf(textRun("From memory."));
    expect(matchesBaseline(baseline, same)).toBe(true);
    expect(gradeCase(aCase({ baseline, last: same, checkedAt: 10 }), 0).verdict).toBe("pass");
    expect(matchesBaseline(baseline, diverged)).toBe(false);
    expect(gradeCase(aCase({ baseline, last: diverged, checkedAt: 10 }), 0).verdict).toBe("fail");
  });

  test("ignores step count and elapsed time — timing is not a regression", () => {
    expect(matchesBaseline(baseline, { ...baseline, steps: baseline.steps + 5, ms: baseline.ms * 10 })).toBe(true);
  });

  test("tool call order does not matter, membership does", () => {
    const ab: RunShape = { ...baseline, tools: ["a", "b"] };
    const ba: RunShape = { ...baseline, tools: ["b", "a"] };
    expect(matchesBaseline(ab, ba)).toBe(true);
    expect(matchesBaseline(ab, { ...baseline, tools: ["a"] })).toBe(false);
  });
});

describe("healthOf", () => {
  const baseline = shapeOf(toolRun("weather", "It is 21C."));
  const passing = aCase({ id: "p", baseline, last: baseline, checkedAt: 10 });
  const failing = aCase({ id: "f", baseline, last: shapeOf(textRun("From memory.")), checkedAt: 10 });

  test("no cases reads as idle, not as a failure", () => {
    const h = healthOf([], 0);
    expect(h.tone).toBe("idle");
    expect(h.label).toBe("no cases");
  });

  test("all passing reads good", () => {
    const h = healthOf([passing, { ...passing, id: "p2" }], 0);
    expect(h).toMatchObject({ pass: 2, fail: 0, tone: "good", label: "2 of 2 pass" });
  });

  test("any failure dominates the badge", () => {
    const h = healthOf([passing, failing], 0);
    expect(h).toMatchObject({ pass: 1, fail: 1, tone: "bad", label: "1 of 2 pass" });
  });

  test("staleness is surfaced when nothing is outright failing", () => {
    const h = healthOf([{ ...passing, checkedAt: 1 }], 10);
    expect(h).toMatchObject({ stale: 1, tone: "warn", label: "1 to re-check" });
  });

  test("unreviewed cases are counted apart from graded ones", () => {
    const h = healthOf([aCase()], 0);
    expect(h).toMatchObject({ unreviewed: 1, pass: 0, fail: 0, label: "1 unreviewed" });
  });

  test("counts always sum to the total", () => {
    const cases = [passing, failing, aCase({ id: "u" }), { ...passing, id: "s", checkedAt: 1 }];
    const h = healthOf(cases, 5);
    expect(h.pass + h.fail + h.stale + h.unreviewed).toBe(h.total);
    expect(h.total).toBe(4);
  });
});
