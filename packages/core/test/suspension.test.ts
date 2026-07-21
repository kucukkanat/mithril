import { expect, test } from "bun:test";
import type { StandardSchemaV1, SuspensionRequest } from "../src/protocol/index.ts";
import { isSuspend, schemaRegistry, SUSPEND, suspend } from "../src/protocol/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

const req: SuspensionRequest = {
  kind: "tool.approval",
  payload: { a: 1 },
  resolutionSchema: schema(),
  resolutionSchemaId: "appr",
};

test("suspend() wraps a request behind the SUSPEND marker", () => {
  const s = suspend(req);
  expect(s[SUSPEND]).toBe(true);
  expect(s.request).toBe(req);
  expect(isSuspend(s)).toBe(true);
});

test("isSuspend is false for plain values", () => {
  expect(isSuspend({})).toBe(false);
  expect(isSuspend(null)).toBe(false);
  expect(isSuspend("x")).toBe(false);
});

test("schemaRegistry resolves ids", () => {
  const r = schemaRegistry({ appr: schema(), other: schema() });
  expect(r.ids).toEqual(["appr", "other"]);
  expect(r.get("appr")).toBeDefined();
  expect(r.get("nope")).toBeUndefined();
});
