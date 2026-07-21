import { expect, test } from "bun:test";
import type { MithrilEvent, SpanRef } from "../src/protocol/index.ts";
import { assertContiguous, inMemoryTransport } from "../src/protocol/index.ts";

const SP: SpanRef = { id: "s", parentId: null, traceId: "t", kind: "chat" };
const mk = (seq: number): MithrilEvent => ({
  v: 1,
  runId: "r",
  seq,
  ts: 0,
  span: SP,
  type: "text.delta",
  delta: String(seq),
});

test("transport catches up via resumeFrom, delivers live, and honors unsubscribe", () => {
  const t = inMemoryTransport();
  t.publish(mk(0));
  t.publish(mk(1));

  const got: number[] = [];
  const unsubscribe = t.subscribe((e) => got.push(e.seq), 0); // catch up from seq 0
  t.publish(mk(2)); // live
  unsubscribe();
  t.publish(mk(3)); // after unsubscribe → not received

  expect(got).toEqual([0, 1, 2]);
});

test("assertContiguous detects gaps", () => {
  expect(assertContiguous(-1, mk(0))).toEqual({ ok: true });
  expect(assertContiguous(1, mk(2))).toEqual({ ok: true });
  expect(assertContiguous(0, mk(2))).toEqual({ ok: false, missingFrom: 1 });
});
