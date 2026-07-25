import { expect, test } from "bun:test";
import type { AnyTool, StandardSchemaV1, ToolDefinition, UndigestedToolDefinition } from "../src/protocol/index.ts";
import { canonicalJson, digestOf, withDigest } from "../src/protocol/index.ts";
import { MithrilError, toolRegistry } from "../src/agent/index.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

function fake(name: string): AnyTool<unknown> {
  return { name, description: `the ${name} tool`, inputSchema: schema<unknown>(), execute: () => name };
}

function def(name: string, body: unknown = { kind: "test" }): ToolDefinition {
  const undigested: UndigestedToolDefinition = {
    name,
    description: `the ${name} tool`,
    inputSchema: { type: "object" },
    body: body as never,
  };
  return withDigest(undigested);
}

// ── seeding ───────────────────────────────────────────────────────────────────────────────────────────

test("a registry is seeded in order with static provenance", () => {
  const r = toolRegistry([fake("a"), fake("b")]);
  expect(r.list().map((t) => t.name)).toEqual(["a", "b"]);
  expect(r.summaries().map((s) => s.provenance.kind)).toEqual(["static", "static"]);
  expect(r.revision).toBe(0); // the seed is the baseline, not a mutation
  expect(r.has("a")).toBe(true);
  expect(r.get("b")?.name).toBe("b");
  expect(r.get("nope")).toBeUndefined();
});

test("a duplicate name in the seed is a configuration error, not a silent last-wins", () => {
  expect(() => toolRegistry([fake("a"), fake("a")])).toThrow(MithrilError);
});

test("registration order is static then setup then runtime", () => {
  const r = toolRegistry([fake("a")]);
  r.register(fake("s"), { kind: "setup", plugin: "p" }, def("s"));
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("x"));
  expect(r.list().map((t) => t.name)).toEqual(["a", "s", "x"]);
  expect(r.summaries().map((s) => s.provenance.kind)).toEqual(["static", "setup", "runtime"]);
});

// ── collisions ────────────────────────────────────────────────────────────────────────────────────────

test("a runtime tool may not shadow a static one", () => {
  const r = toolRegistry([fake("send_email")]);
  expect(() => r.register(fake("send_email"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("send_email"))).toThrow(
    MithrilError,
  );
  // The original capability survives untouched — that is the point of rejecting rather than shadowing.
  expect(r.get("send_email")?.execute(undefined as never, undefined as never)).toBe("send_email");
});

test("TOOL_NAME_TAKEN names the incumbent's provenance", () => {
  const r = toolRegistry([]);
  r.register(fake("x"), { kind: "setup", plugin: "authoring" }, def("x"));
  try {
    r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("x", { kind: "other" }));
    throw new Error("expected a throw");
  } catch (e) {
    expect((e as MithrilError).code).toBe("TOOL_NAME_TAKEN");
    expect((e as MithrilError).message).toContain('plugin "authoring"');
  }
});

test("re-registering an identical digest is a no-op, so replay and Tier-2 re-entry are safe", () => {
  const r = toolRegistry([]);
  const d = def("x");
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, d);
  const revisionAfterFirst = r.revision;
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, d);
  expect(r.list().length).toBe(1);
  expect(r.revision).toBe(revisionAfterFirst); // a no-op is not a mutation
});

test("a different digest under the same name is rejected even for runtime provenance", () => {
  const r = toolRegistry([]);
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("x", { kind: "a" }));
  expect(() => r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c2" }, def("x", { kind: "b" }))).toThrow(
    MithrilError,
  );
});

// ── revocation ────────────────────────────────────────────────────────────────────────────────────────

test("revoke removes a runtime tool and reports whether anything was removed", () => {
  const r = toolRegistry([]);
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("x"));
  expect(r.revoke("x")).toBe(true);
  expect(r.has("x")).toBe(false);
  expect(r.revoke("x")).toBe(false);
  expect(r.revoke("never-existed")).toBe(false);
});

test("a static or plugin tool is not revocable", () => {
  const r = toolRegistry([fake("a")]);
  r.register(fake("p"), { kind: "plugin", plugin: "pkg" });
  expect(() => r.revoke("a")).toThrow(MithrilError);
  expect(() => r.revoke("p")).toThrow(MithrilError);
  try {
    r.revoke("a");
  } catch (e) {
    expect((e as MithrilError).code).toBe("TOOL_NOT_REVOCABLE");
  }
});

test("revoke then re-register under the same name is the supported replacement path", () => {
  const r = toolRegistry([]);
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c1" }, def("x", { kind: "a" }));
  r.revoke("x");
  r.register(fake("x"), { kind: "runtime", by: "define_tool", callId: "c2" }, def("x", { kind: "b" }));
  expect(r.list().map((t) => t.name)).toEqual(["x"]);
});

test("revision counts accepted mutations only", () => {
  const r = toolRegistry([fake("a")]);
  expect(r.revision).toBe(0);
  r.register(fake("x"), { kind: "runtime", by: "d", callId: "c1" }, def("x"));
  expect(r.revision).toBe(1);
  r.revoke("x");
  expect(r.revision).toBe(2);
  r.revoke("gone"); // returns false, mutates nothing
  expect(r.revision).toBe(2);
});

// ── digest ────────────────────────────────────────────────────────────────────────────────────────────

test("canonicalJson sorts object keys so equal values stringify identically", () => {
  expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  expect(canonicalJson([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  // Arrays are ordered data, not a set — order must still matter.
  expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
});

test("digestOf is stable across property order and sensitive to content", () => {
  const a: UndigestedToolDefinition = { name: "x", description: "d", inputSchema: { type: "object" }, body: { k: 1 } };
  const b: UndigestedToolDefinition = { body: { k: 1 }, inputSchema: { type: "object" }, description: "d", name: "x" };
  expect(digestOf(a)).toBe(digestOf(b));
  expect(digestOf({ ...a, description: "different" })).not.toBe(digestOf(a));
  expect(digestOf({ ...a, body: { k: 2 } })).not.toBe(digestOf(a));
  expect(digestOf(a)).toMatch(/^[0-9a-f]{8}$/);
});

test("an absent optional field digests the same as an explicitly undefined one", () => {
  const base: UndigestedToolDefinition = { name: "x", description: "d", inputSchema: { type: "object" }, body: null };
  expect(digestOf({ ...base, version: undefined })).toBe(digestOf(base));
});
