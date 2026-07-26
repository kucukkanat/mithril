/*
 * The ordering invariant: generated decls are `const`s emitted in `decls` order, so anything
 * referenced before it initializes is a run-time TDZ crash. These tests assert the property that
 * actually matters — every reference resolves to a decl ABOVE it — rather than one blessed
 * permutation, plus the two things the sort must never do: drop a decl, or push one later.
 */
import { describe, expect, test } from "bun:test";
import { generateProject, SPEC_VERSION, type AgentSpec, type OpaqueDecl, type ProjectDecl, type ProjectSpec, type SubAgentToolSpec, type ToolSpec } from "@mithril/spec";
import { orderDecls } from "../src/lib/order.ts";
import { attachTool, newAgent, newTool } from "../src/lib/attach.ts";

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
const opaque = (id: string, code: string): OpaqueDecl => ({ kind: "opaque", id, code });

const spec = (decls: readonly ProjectDecl[], target = "a1"): ProjectSpec => ({
  specVersion: SPEC_VERSION,
  name: "p",
  decls,
  entry: { target, input: "" },
});

const ids = (s: ProjectSpec): readonly string[] => s.decls.map((d) => d.id);
const indexOf = (s: ProjectSpec, id: string): number => ids(s).indexOf(id);

describe("orderDecls", () => {
  test("lifts a tool above the agent that lists it — the reported TDZ crash", () => {
    const before = spec([agent("a1", ["tool1"]), tool("tool1")]);
    const after = orderDecls(before);
    expect(ids(after)).toEqual(["tool1", "a1"]);
    // The generated file is what actually runs, so assert against it, not just the spec.
    const code = generateProject(after);
    expect(code.indexOf("const tool1 =")).toBeLessThan(code.indexOf("const a1 ="));
  });

  test("an already-correct spec is returned unchanged, by identity", () => {
    const before = spec([tool("t1"), agent("a1", ["t1"])]);
    expect(orderDecls(before)).toBe(before);
  });

  test("resolves a chain: asTool above its parent, its child agent above it", () => {
    const after = orderDecls(spec([agent("parent", ["ask_child"]), sub("ask_child", "child"), agent("child")]));
    expect(indexOf(after, "child")).toBeLessThan(indexOf(after, "ask_child"));
    expect(indexOf(after, "ask_child")).toBeLessThan(indexOf(after, "parent"));
  });

  test("preserves relative order of decls that don't depend on each other", () => {
    const after = orderDecls(spec([tool("t1"), tool("t2"), tool("t3"), agent("a1", ["t3"])]));
    expect(ids(after)).toEqual(["t1", "t2", "t3", "a1"]);
  });

  test("lifts only what is needed, as little as possible", () => {
    const after = orderDecls(spec([tool("t1"), agent("a1", ["t2"]), tool("t2"), tool("t3")]));
    expect(ids(after)).toEqual(["t1", "t2", "a1", "t3"]);
  });

  test("keeps a tool below an opaque const its schema references", () => {
    const schema = opaque("o1", "const CitySchema = z.object({ city: z.string() });");
    const after = orderDecls(spec([schema, tool("t1", { inputSchema: { zod: "CitySchema" } }), agent("a1", ["t1"])]));
    expect(ids(after)).toEqual(["o1", "t1", "a1"]);
  });

  test("lifts a tool across an opaque decl that does not declare what it needs", () => {
    const after = orderDecls(spec([agent("a1", ["t1"]), opaque("o1", "const unrelated = 1;"), tool("t1")]));
    expect(indexOf(after, "t1")).toBeLessThan(indexOf(after, "a1"));
    // The opaque may not overtake the agent: it could reference it, and nothing can prove otherwise.
    expect(indexOf(after, "a1")).toBeLessThan(indexOf(after, "o1"));
  });

  test("holds an agent below an opaque decl its middleware expression uses", () => {
    const mw = opaque("o1", "const audit = () => ({ name: 'audit' });");
    const after = orderDecls(spec([mw, agent("a1", [], { use: [{ code: "audit()" }] })]));
    expect(ids(after)).toEqual(["o1", "a1"]);
  });

  test("a lazy body reference is not a dependency — no phantom cycle", () => {
    // t1's execute calls a2, and a1 owns t1: eager edges only, so this orders cleanly.
    const before = spec([agent("a1", ["t1"]), tool("t1", { execute: { code: "async () => a2.run('x')" } }), agent("a2")]);
    const after = orderDecls(before);
    expect(indexOf(after, "t1")).toBeLessThan(indexOf(after, "a1"));
  });

  test("a genuine cycle degrades instead of throwing, and keeps every decl", () => {
    // a1 → t1 (it lists it); t1 → a1 (its schema reads off a1 eagerly). Unsatisfiable by any order,
    // and unreachable from generated code — but the Designer must not hang or lose work over it.
    const after = orderDecls(spec([agent("a1", ["t1"]), tool("t1", { inputSchema: { zod: "a1.inputShape" } }), tool("t2")]));
    expect([...ids(after)].sort()).toEqual(["a1", "t1", "t2"]);
  });

  test("never drops or duplicates a decl, whatever the order", () => {
    const decls = [agent("a1", ["t2", "ask_b"]), sub("ask_b", "b"), tool("t2"), agent("b", ["t1"]), tool("t1"), opaque("o1", "const k = 1;")];
    const after = orderDecls(spec(decls));
    expect(after.decls).toHaveLength(decls.length);
    expect([...ids(after)].sort()).toEqual([...decls.map((d) => d.id)].sort());
  });

  test("every structural reference resolves above its user", () => {
    const after = orderDecls(spec([agent("a1", ["ask_b", "t1"]), sub("ask_b", "b"), agent("b", ["t2"]), tool("t2"), tool("t1")]));
    for (const d of after.decls) {
      if (d.kind === "agent") for (const t of d.tools) expect(indexOf(after, t)).toBeLessThan(indexOf(after, d.id));
      if (d.kind === "subAgentTool") expect(indexOf(after, d.agentId)).toBeLessThan(indexOf(after, d.id));
    }
  });

  test("everything else in the spec is untouched", () => {
    const before = spec([agent("a1", ["t1"]), tool("t1")], "a1");
    const after = orderDecls({ ...before, meta: { layout: { a1: { x: 1, y: 2 } } } });
    expect(after.entry).toEqual(before.entry);
    expect(after.name).toBe(before.name);
    expect(after.meta).toEqual({ layout: { a1: { x: 1, y: 2 } } });
  });
});

describe("the Designer flow that produced the crash", () => {
  test("add a tool to an existing agent, then attach it — the tool lands above the agent", () => {
    // Exactly what DesignerPage does: newTool + append, then a drag onto the agent.
    let s = spec([agent("a1")]);
    const t = newTool(s);
    s = { ...s, decls: [...s.decls, t] };
    s = orderDecls(attachTool(s, t.id, "a1"));

    expect(indexOf(s, t.id)).toBeLessThan(indexOf(s, "a1"));
    const code = generateProject(s);
    expect(code.indexOf(`const ${t.id} =`)).toBeLessThan(code.indexOf("const a1 ="));
  });

  test("add an agent after existing tools, attach one, and both agents stay valid", () => {
    let s = spec([tool("t1"), agent("a1", ["t1"])]);
    const a = newAgent(s);
    s = orderDecls(attachTool({ ...s, decls: [...s.decls, a] }, "t1", a.id));

    expect(indexOf(s, "t1")).toBeLessThan(indexOf(s, a.id));
    expect(ids(s)).toContain("a1");
  });

  test("detaching leaves the order valid", () => {
    const s = orderDecls(attachTool(orderDecls(spec([agent("a1", ["t1"]), tool("t1")])), "t1", null));
    expect(ids(s)).toEqual(["t1", "a1"]);
  });
});
