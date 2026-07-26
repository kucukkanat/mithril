import { describe, expect, test } from "bun:test";
import type { MithrilEvent, SpanRef } from "@mithril/core/protocol";
import { appendRun, ARCHIVE_LIMIT, EVENTS_PER_RUN, reasoningOf, toolTrace, type ArchivedRun } from "../src/lib/run-archive.ts";

/*
 * Studio used to reduce every run to a verdict and drop the events. The sentence that explained the real
 * failure — the model saying it could not call a tool without arguments — was emitted and discarded.
 */

const SPAN: SpanRef = { id: "s", parentId: null, traceId: "t", kind: "chat" };
const ev = (seq: number, rest: Record<string, unknown>): MithrilEvent => ({ v: 1, runId: "r", seq, ts: seq, span: SPAN, ...rest }) as MithrilEvent;
const runOf = (over: Partial<ArchivedRun> = {}): ArchivedRun => ({
  id: `r-${over.at ?? 0}`,
  at: 0,
  caseId: null,
  input: "hi",
  status: "done",
  events: [],
  ...over,
});

describe("appendRun", () => {
  test("newest first, oldest dropped past the limit", () => {
    let archive: readonly ArchivedRun[] = [];
    for (let i = 0; i < ARCHIVE_LIMIT + 5; i++) archive = appendRun(archive, runOf({ at: i, id: `r-${i}` }));
    expect(archive).toHaveLength(ARCHIVE_LIMIT);
    expect(archive[0]?.id).toBe(`r-${ARCHIVE_LIMIT + 4}`);
    expect(archive.some((r) => r.id === "r-0")).toBe(false);
  });

  test("an over-long run keeps its HEAD and says how much it dropped", () => {
    const events = Array.from({ length: EVENTS_PER_RUN + 10 }, (_, i) => ev(i, { type: "text.delta", delta: String(i) }));
    const [kept] = appendRun([], runOf({ events }));
    expect(kept?.events).toHaveLength(EVENTS_PER_RUN);
    expect(kept?.truncated).toBe(10);
    // The head is where a run diverges; the tail is usually repetition.
    expect((kept?.events[0] as { delta: string }).delta).toBe("0");
  });

  test("a run inside the cap is untouched and never claims truncation", () => {
    const [kept] = appendRun([], runOf({ events: [ev(0, { type: "text.delta", delta: "x" })] }));
    expect(kept?.truncated).toBeUndefined();
  });
});

test("reasoning is returned whole, not as a 90-character preview", () => {
  const long = "the calendarreader might need some input to generate the list, and without that info I cannot call it";
  const events = long.split(" ").map((w, i) => ev(i, { type: "reasoning.delta", delta: `${w} ` }));
  expect(reasoningOf(events).trim()).toBe(long);
});

describe("toolTrace", () => {
  test("pairs each call with its result, in call order", () => {
    const trace = toolTrace([
      ev(0, { type: "tool.call", callId: "c1", name: "calendar", input: {} }),
      ev(1, { type: "tool.result", callId: "c1", output: { events: 1 }, ms: 1 }),
      ev(2, { type: "tool.call", callId: "c2", name: "notes", input: { p: "T" } }),
      ev(3, { type: "tool.error", callId: "c2", error: { name: "Error", message: "boom", classification: "unknown", retryable: false } }),
    ]);
    expect(trace.map((t) => t.name)).toEqual(["calendar", "notes"]);
    expect(trace[0]?.output).toEqual({ events: 1 });
    expect(trace[1]?.error).toBe("boom");
    expect(trace[1]?.output).toBeUndefined();
  });

  test("a call with no outcome still appears — a run that hung must not look empty", () => {
    const trace = toolTrace([ev(0, { type: "tool.call", callId: "c1", name: "calendar", input: {} })]);
    expect(trace).toEqual([{ name: "calendar", input: {} }]);
  });
});
