/*
 * The change plan an AI edit shows before it is applied. The load-bearing property is the negative
 * one: a spec that only got REORDERED must report no changes, because orderDecls reshuffles decls
 * whenever references change and phantom churn would make the plan untrustworthy.
 */
import { describe, expect, test } from "bun:test";
import { SPEC_VERSION, type AgentSpec, type ProjectDecl, type ProjectSpec, type SubAgentToolSpec, type ToolSpec } from "@mithril/spec";
import { describeChange, planChanges } from "../src/lib/spec-diff.ts";

const LOCAL = { kind: "local" as const, model: "m" };
const tool = (id: string, extra: Partial<ToolSpec> = {}): ToolSpec => ({
  kind: "tool",
  id,
  name: id,
  description: "d",
  inputSchema: { zod: "z.object({})" },
  execute: { code: "async () => ({})" },
  ...extra,
});
const agent = (id: string, tools: string[] = [], extra: Partial<AgentSpec> = {}): AgentSpec => ({
  kind: "agent",
  id,
  model: LOCAL,
  instructions: "i",
  tools,
  ...extra,
});
const sub = (id: string, agentId: string): SubAgentToolSpec => ({ kind: "subAgentTool", id, agentId, name: id, description: "d" });
const spec = (decls: readonly ProjectDecl[], target = "a1"): ProjectSpec => ({ specVersion: SPEC_VERSION, name: "p", decls, entry: { target, input: "" } });

const BASE = spec([tool("t1"), agent("a1", ["t1"])]);

describe("planChanges", () => {
  test("an identical spec has no changes", () => {
    expect(planChanges(BASE, spec([tool("t1"), agent("a1", ["t1"])]))).toEqual([]);
  });

  test("REORDERING alone is not a change — orderDecls must not show as churn", () => {
    expect(planChanges(BASE, spec([agent("a1", ["t1"]), tool("t1")]))).toEqual([]);
  });

  test("reshuffling an agent's tool list is not a change either", () => {
    const before = spec([tool("t1"), tool("t2"), agent("a1", ["t1", "t2"])]);
    const after = spec([tool("t1"), tool("t2"), agent("a1", ["t2", "t1"])]);
    expect(planChanges(before, after)).toEqual([]);
  });

  test("an added decl is reported with its purpose", () => {
    const after = spec([tool("t1"), tool("refund", { description: "Refund an order." }), agent("a1", ["t1", "refund"])]);
    const changes = planChanges(BASE, after);
    expect(changes).toContainEqual({ kind: "add", id: "refund", declKind: "tool", label: "Refund an order." });
    // The agent gained a tool, so it is an update too — the plan must show both.
    expect(changes.some((c) => c.kind === "update" && c.id === "a1")).toBe(true);
  });

  test("a removed decl is reported", () => {
    expect(planChanges(BASE, spec([agent("a1")]))).toContainEqual({ kind: "remove", id: "t1", declKind: "tool", label: "d" });
  });

  test("a field change carries before and after", () => {
    const after = spec([tool("t1", { description: "Now it says when." }), agent("a1", ["t1"])]);
    const [change] = planChanges(BASE, after);
    expect(change).toEqual({ kind: "update", id: "t1", declKind: "tool", fields: [{ field: "description", before: "d", after: "Now it says when." }] });
  });

  test("a rewritten tool body shows as one field change, not a rewrite of the decl", () => {
    const after = spec([tool("t1", { execute: { code: "async () => ({ ok: true })" } }), agent("a1", ["t1"])]);
    const [change] = planChanges(BASE, after);
    expect(change?.kind === "update" && change.fields.map((f) => f.field)).toEqual(["body"]);
  });

  test("a decl whose kind changed reads as a replacement", () => {
    const before = spec([agent("x"), agent("a1")]);
    const after = spec([sub("x", "a1"), agent("a1")]);
    const changes = planChanges(before, after);
    expect(changes.some((c) => c.kind === "remove" && c.id === "x")).toBe(true);
    expect(changes.some((c) => c.kind === "add" && c.id === "x")).toBe(true);
  });

  test("moving the entry point is its own change", () => {
    const before = spec([agent("a1"), agent("a2")], "a1");
    const after = spec([agent("a1"), agent("a2")], "a2");
    expect(planChanges(before, after)).toEqual([{ kind: "entry", before: "a1", after: "a2" }]);
  });

  test("a renamed decl is a remove plus an add — ids are the identity", () => {
    const changes = planChanges(BASE, spec([tool("t1_renamed"), agent("a1", ["t1_renamed"])]));
    expect(changes.some((c) => c.kind === "add" && c.id === "t1_renamed")).toBe(true);
    expect(changes.some((c) => c.kind === "remove" && c.id === "t1")).toBe(true);
  });

  test("optional fields appearing or vanishing register", () => {
    const withApproval = spec([tool("t1", { needsApproval: true }), agent("a1", ["t1"])]);
    expect(planChanges(BASE, withApproval)).toEqual([
      { kind: "update", id: "t1", declKind: "tool", fields: [{ field: "approval", before: "", after: "true" }] },
    ]);
  });
});

describe("describeChange", () => {
  test.each([
    [{ kind: "add", id: "refund", declKind: "tool", label: "" } as const, "Add tool refund"],
    [{ kind: "add", id: "ask_b", declKind: "subAgentTool", label: "" } as const, "Add sub-agent ask_b"],
    [{ kind: "remove", id: "t1", declKind: "agent", label: "" } as const, "Remove agent t1"],
    [{ kind: "entry", before: "a", after: "b" } as const, "The run starts at b instead of a"],
    [{ kind: "update", id: "t1", declKind: "tool", fields: [{ field: "name", before: "", after: "" }] } as const, "Change t1 — name"],
  ])("%p", (change, expected) => {
    expect(describeChange(change)).toBe(expected);
  });
});
