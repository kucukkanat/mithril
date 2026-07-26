import { describe, expect, test } from "bun:test";
import { SPEC_VERSION, type AgentSpec, type ProjectSpec, type SubAgentToolSpec, type ToolSpec } from "@mithril/spec";
import { attachTool, freshId, makeEntry, newAgent, newTool, ownerOf, removeDecl } from "../src/lib/attach.ts";

const LOCAL = { kind: "local" as const, model: "m" };
const tool = (id: string): ToolSpec => ({
  kind: "tool",
  id,
  name: id,
  description: "d",
  inputSchema: { zod: "z.object({})" },
  execute: { code: "async () => ({})" },
});
const agent = (id: string, tools: string[] = []): AgentSpec => ({ kind: "agent", id, model: LOCAL, instructions: "i", tools });

const spec = (decls: ProjectSpec["decls"], target = "a1"): ProjectSpec => ({
  specVersion: SPEC_VERSION,
  name: "p",
  decls,
  entry: { target, input: "" },
});

const base = spec([tool("t1"), tool("t2"), agent("a1", ["t1"]), agent("a2")]);

describe("ownerOf", () => {
  test("finds the owning agent, or null when nothing can call it", () => {
    expect(ownerOf(base, "t1")).toBe("a1");
    expect(ownerOf(base, "t2")).toBeNull();
  });
});

describe("attachTool", () => {
  test("attaching a loose tool gives it exactly one owner", () => {
    const next = attachTool(base, "t2", "a2");
    expect(ownerOf(next, "t2")).toBe("a2");
    expect(ownerOf(next, "t1")).toBe("a1");
  });

  test("a drag is a MOVE, not a copy — the old owner loses it", () => {
    const next = attachTool(base, "t1", "a2");
    expect(ownerOf(next, "t1")).toBe("a2");
    const a1 = next.decls.find((d) => d.id === "a1");
    expect(a1?.kind === "agent" && a1.tools).toEqual([]);
  });

  test("detaching removes it from every agent", () => {
    const next = attachTool(base, "t1", null);
    expect(ownerOf(next, "t1")).toBeNull();
    expect(next.decls.filter((d) => d.kind === "agent").every((d) => d.kind === "agent" && d.tools.length === 0)).toBe(true);
  });

  test("re-attaching to the current owner does not duplicate it", () => {
    const a1 = attachTool(base, "t1", "a1").decls.find((d) => d.id === "a1");
    expect(a1?.kind === "agent" && a1.tools).toEqual(["t1"]);
  });

  test("an unknown tool or unknown agent is a no-op", () => {
    expect(attachTool(base, "nope", "a1")).toBe(base);
    expect(attachTool(base, "t1", "nope")).toBe(base);
  });

  test("an agent cannot be dragged like a tool", () => {
    expect(attachTool(base, "a2", "a1")).toBe(base);
  });

  test("an asTool wrapper cannot be attached to the agent it wraps", () => {
    const wrapper: SubAgentToolSpec = { kind: "subAgentTool", id: "w", agentId: "a2", name: "w", description: "d" };
    const s = spec([agent("a1"), agent("a2"), wrapper]);
    expect(attachTool(s, "w", "a2")).toBe(s);
    expect(ownerOf(attachTool(s, "w", "a1"), "w")).toBe("a1");
  });
});

describe("freshId", () => {
  test("skips ids already taken", () => {
    expect(freshId(base, "tool")).toBe("tool1");
    expect(freshId(spec([tool("tool1"), tool("tool2"), agent("a1")]), "tool")).toBe("tool3");
  });
});

describe("newTool / newAgent", () => {
  test("a new tool has an empty description so the lint flags it immediately", () => {
    expect(newTool(base).description).toBe("");
  });

  test("new decls get unique ids and a new agent runs on-device", () => {
    expect(newTool(base).id).toBe("tool1");
    expect(newAgent(base).id).toBe("agent1");
    expect(newAgent(base).model.kind).toBe("local");
  });
});

describe("removeDecl", () => {
  test("deleting a tool drops it from its owner", () => {
    const next = removeDecl(base, "t1");
    expect(next.decls.some((d) => d.id === "t1")).toBe(false);
    const a1 = next.decls.find((d) => d.id === "a1");
    expect(a1?.kind === "agent" && a1.tools).toEqual([]);
  });

  test("deleting the entry agent re-points the entry rather than dangling", () => {
    const next = removeDecl(base, "a1");
    expect(next.entry.target).toBe("a2");
  });

  test("deleting the last agent leaves an empty target, never a stale one", () => {
    const next = removeDecl(spec([agent("a1")]), "a1");
    expect(next.entry.target).toBe("");
    expect(next.decls).toEqual([]);
  });

  test("deleting an agent also removes any asTool wrapping it, and detaches that wrapper", () => {
    const wrapper: SubAgentToolSpec = { kind: "subAgentTool", id: "w", agentId: "child", name: "w", description: "d" };
    const s = spec([agent("child"), wrapper, agent("a1", ["w"])], "a1");
    const next = removeDecl(s, "child");
    expect(next.decls.some((d) => d.id === "w")).toBe(false);
    const a1 = next.decls.find((d) => d.id === "a1");
    expect(a1?.kind === "agent" && a1.tools).toEqual([]);
  });

  test("deleting something that isn't there changes nothing meaningful", () => {
    expect(removeDecl(base, "ghost").decls).toHaveLength(base.decls.length);
  });
});

describe("makeEntry", () => {
  test("re-points the entry to another agent", () => {
    expect(makeEntry(base, "a2").entry.target).toBe("a2");
  });

  test("refuses a tool or an unknown id", () => {
    expect(makeEntry(base, "t1")).toBe(base);
    expect(makeEntry(base, "nope")).toBe(base);
  });
});
