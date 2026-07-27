/*
 * The creator's pure half: the program it emits, the payloads it accepts, and the spec it builds.
 *
 * The keystone is the round-trip assertion at the bottom. A machine-generated spec is exactly where
 * id collisions, malformed zod and unrecognized shapes show up, and `parse(generate(s)) ≡ s` catches
 * all three in one line — a project that fails it is one the Designer would corrupt on first edit.
 */
import { describe, expect, test } from "bun:test";
import * as ts from "typescript";
import { generateProject, type ModelSpec, type ProjectSpec } from "@mithril/spec";
import { parseProject } from "@mithril/spec/parse";
import {
  RESERVED_IDS,
  creatorProgram,
  creatorPromptFor,
  creatorToSpec,
  isCompleteFunction,
  parseCreatorEvents,
  specSummary,
  type CreatorEvent,
} from "../src/lib/creator.ts";

const LOCAL: ModelSpec = { kind: "local", model: "m" };
const BODY = "async ({ city }) => ({ city, tempC: 21 })";

const toolEvent = (name: string, extra: Partial<Extract<CreatorEvent, { kind: "tool" }>> = {}): CreatorEvent => ({
  kind: "tool",
  name,
  description: "d",
  inputs: [{ name: "city", type: "text", description: "e.g. Oslo" }],
  code: BODY,
  ...extra,
});
const agentEvent = (id: string, tools: string[] = []): CreatorEvent => ({ kind: "agent", id, purpose: "p", instructions: "i", tools });

describe("creatorProgram", () => {
  test("embeds the exact prompt the gate previews — no paraphrase", () => {
    const req = { kind: "create", job: "a weather bot" } as const;
    expect(creatorProgram(req, LOCAL)).toContain(JSON.stringify(creatorPromptFor(req)));
  });

  test("declares every meta-tool and hands all of them to the creator", () => {
    const program = creatorProgram({ kind: "create", job: "j" }, LOCAL);
    for (const name of ["create_tool", "create_agent", "create_subagent", "attach_tool", "remove_decl", "finish"]) {
      expect(program).toContain(`const ${name} = tool({`);
    }
    expect(program).toContain("tools: [create_tool, create_agent, create_subagent, attach_tool, remove_decl, finish]");
  });

  test("is a tool-caller, not a structured-output run", () => {
    // An `output:` schema would make the loop finalize into an object and defeat the whole design.
    expect(creatorProgram({ kind: "create", job: "j" }, LOCAL)).not.toContain("output:");
  });

  test("never imports the injected globals, and reaches a provider the way codegen does", () => {
    const program = creatorProgram({ kind: "create", job: "j" }, { kind: "live", provider: "anthropic", model: "claude-sonnet-4-5" });
    expect(program).toContain(`import { anthropic } from "mithril/anthropic";`);
    expect(program).not.toContain("run,");
    expect(program).not.toContain("emit }");
  });

  test("groq goes through the provider const codegen emits", () => {
    const program = creatorProgram({ kind: "create", job: "j" }, { kind: "live", provider: "groq", model: "llama-3.3-70b" });
    expect(program).toContain("const groq = openaiProvider(");
    expect(program).toContain(`{ id: "groq/llama-3.3-70b", provider: groq }`);
  });
});

describe("the edit prompt keeps the gate's promise", () => {
  const spec: ProjectSpec = {
    specVersion: 1,
    name: "p",
    decls: [
      {
        kind: "tool",
        id: "get_weather",
        name: "get_weather",
        description: "Look up weather.",
        inputSchema: { zod: "z.object({ city: z.string(), days: z.number() })" },
        execute: { code: "async () => ({ secret: process.env.MY_PRIVATE_KEY })" },
      },
      { kind: "agent", id: "assistant", model: LOCAL, instructions: "Be helpful.", tools: ["get_weather"] },
    ],
    entry: { target: "assistant", input: "" },
  };

  test("the summary carries structure — names, descriptions, input names and types", () => {
    const summary = specSummary(spec);
    expect(summary).toContain("tool get_weather(city: text, days: number) — Look up weather.");
    expect(summary).toContain("agent assistant");
    expect(summary).toContain("can call: get_weather");
    expect(summary).toContain("the run starts at assistant");
  });

  test("and carries NO tool body — DraftGate promises 'not your tool code'", () => {
    const prompt = creatorPromptFor({ kind: "edit", instruction: "add a refund tool", summary: specSummary(spec) });
    expect(prompt).not.toContain("MY_PRIVATE_KEY");
    expect(prompt).not.toContain("process.env");
    expect(prompt).toContain("add a refund tool");
  });
});

describe("parseCreatorEvents", () => {
  test("keeps order and drops what it cannot use", () => {
    const events = parseCreatorEvents([
      { v: 1, kind: "tool", name: "a", description: "d", inputs: [], code: BODY },
      { v: 1, kind: "tool", description: "no name" },
      "not an object",
      { v: 1, kind: "unknown_kind" },
      { v: 1, kind: "agent", id: "x", instructions: "i", tools: ["a"] },
    ]);
    expect(events.map((e) => e.kind)).toEqual(["tool", "agent"]);
  });

  test("an agent with no instructions is meaningless, so it is dropped", () => {
    expect(parseCreatorEvents([{ kind: "agent", id: "x", instructions: "   " }])).toEqual([]);
  });

  test("coerces an unknown input type rather than dropping the input", () => {
    const [first] = parseCreatorEvents([{ kind: "tool", name: "t", inputs: [{ name: "n", type: "wat" }], code: BODY }]);
    expect(first).toMatchObject({ kind: "tool", inputs: [{ name: "n", type: "text" }] });
  });

  test("a subagent with no exposeName still gets a callable one", () => {
    const [first] = parseCreatorEvents([{ kind: "subagent", id: "billing", instructions: "i", parent: "assistant" }]);
    expect(first).toMatchObject({ kind: "subagent", exposeName: "ask_billing" });
  });
});

describe("isCompleteFunction", () => {
  test.each([
    ["async ({ city }) => ({ city })", true],
    ["async () => {\n  // a comment with an unbalanced { brace\n  return { ok: true };\n}", true],
    ["function f() { return 1; }", true],
    ['async () => ({ s: "a string with a } brace" })', true],
    ["async () => { return 1;", false],
    ["Here is a function that gets the weather.", false],
    ["", false],
    ["async () => { return 1; } }", false],
  ])("%p → %p", (code, expected) => {
    expect(isCompleteFunction(code)).toBe(expected);
  });
});

describe("creatorToSpec", () => {
  test("wires tools to the agent that asked for them", () => {
    const { spec } = creatorToSpec([toolEvent("get_weather"), agentEvent("assistant", ["get_weather"])], LOCAL, "j");
    const agent = spec.decls.find((d) => d.kind === "agent");
    expect(agent).toMatchObject({ id: "assistant", tools: ["get_weather"] });
    expect(spec.entry.target).toBe("assistant");
  });

  test("a name that collides with a framework binding is renamed, not shipped", () => {
    // `const groq = ...` is emitted by codegen for a groq model; a second one cannot be opened.
    const { spec } = creatorToSpec([toolEvent("groq"), toolEvent("z"), agentEvent("assistant", ["groq", "z"])], LOCAL, "j");
    const ids = spec.decls.map((d) => d.id);
    for (const id of ids) expect(RESERVED_IDS.has(id)).toBe(false);
    expect(ids).toContain("groq_1");
  });

  test("the same name twice REPLACES, so an edit can rewrite a tool by naming it", () => {
    const { spec } = creatorToSpec([toolEvent("lookup"), toolEvent("lookup", { description: "the rewrite" }), agentEvent("a")], LOCAL, "j");
    const tools = spec.decls.filter((d) => d.kind === "tool");
    expect(tools.map((d) => d.id)).toEqual(["lookup"]);
    expect(tools[0]).toMatchObject({ description: "the rewrite" });
  });

  test("but two DIFFERENT names that sanitize alike stay distinct", () => {
    const { spec } = creatorToSpec([toolEvent("look up"), toolEvent("look-up"), agentEvent("a")], LOCAL, "j");
    expect(spec.decls.filter((d) => d.kind === "tool").map((d) => d.id)).toEqual(["look_up", "look_up_2"]);
  });

  test("a subagent becomes a child agent plus a wrapper the parent can call", () => {
    const { spec } = creatorToSpec(
      [
        toolEvent("lookup_account"),
        agentEvent("assistant"),
        {
          kind: "subagent",
          id: "billing",
          purpose: "p",
          instructions: "You handle billing.",
          tools: ["lookup_account"],
          parent: "assistant",
          exposeName: "ask_billing",
          exposeDescription: "Use this for billing questions.",
        },
      ],
      LOCAL,
      "j",
    );
    expect(spec.decls.find((d) => d.kind === "subAgentTool")).toMatchObject({ id: "ask_billing", agentId: "billing" });
    expect(spec.decls.find((d) => d.kind === "agent" && d.id === "assistant")).toMatchObject({ tools: ["ask_billing"] });
    expect(spec.decls.find((d) => d.kind === "agent" && d.id === "billing")).toMatchObject({ tools: ["lookup_account"] });
  });

  test("the wrapper has NO input schema — asTool's own default must survive", () => {
    // Emitting `z.object({})` here would leave the parent unable to pass anything to the specialist.
    const { spec } = creatorToSpec(
      [agentEvent("assistant"), { kind: "subagent", id: "b", purpose: "p", instructions: "i", tools: [], parent: "assistant", exposeName: "ask_b", exposeDescription: "d" }],
      LOCAL,
      "j",
    );
    const sub = spec.decls.find((d) => d.kind === "subAgentTool");
    expect(sub !== undefined && "input" in sub).toBe(false);
  });

  test("the run never starts inside a specialist that exists only to be delegated to", () => {
    const { spec } = creatorToSpec(
      [
        { kind: "subagent", id: "billing", purpose: "p", instructions: "i", tools: [], parent: "router", exposeName: "ask_billing", exposeDescription: "d" },
        agentEvent("router"),
      ],
      LOCAL,
      "j",
    );
    expect(spec.entry.target).toBe("router");
  });

  test("an unusable body falls back to a placeholder, and says so", () => {
    const { spec, notes } = creatorToSpec([toolEvent("t", { code: "Here is how you would get the weather." }), agentEvent("a", ["t"])], LOCAL, "j");
    const tool = spec.decls.find((d) => d.kind === "tool");
    expect(tool?.kind === "tool" && tool.execute.code).toContain("TODO");
    expect(notes.some((n) => n.text.includes("wasn't usable code"))).toBe(true);
  });

  test("a real body is kept verbatim", () => {
    const { spec, notes } = creatorToSpec([toolEvent("t"), agentEvent("a", ["t"])], LOCAL, "j");
    const tool = spec.decls.find((d) => d.kind === "tool");
    expect(tool?.kind === "tool" && tool.execute.code).toBe(BODY);
    expect(notes).toEqual([]);
  });

  test("tools but no agent: one is synthesized, and the note admits it", () => {
    const { spec, notes } = creatorToSpec([toolEvent("a"), toolEvent("b")], LOCAL, "book me a flight");
    const agent = spec.decls.find((d) => d.kind === "agent");
    expect(agent).toMatchObject({ instructions: "book me a flight", tools: ["a", "b"] });
    expect(notes.some((n) => n.text.includes("Studio added one"))).toBe(true);
  });

  test("a tool an agent asked for but nobody created is dropped, loudly", () => {
    const { spec, notes } = creatorToSpec([agentEvent("a", ["ghost"])], LOCAL, "j");
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: [] });
    expect(notes.some((n) => n.text.includes("never created"))).toBe(true);
  });

  test("a loose tool is auto-attached only when there is exactly one agent", () => {
    const one = creatorToSpec([toolEvent("t"), agentEvent("a")], LOCAL, "j");
    expect(one.spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: ["t"] });

    const two = creatorToSpec([toolEvent("t"), agentEvent("a"), agentEvent("b")], LOCAL, "j");
    expect(two.spec.decls.filter((d) => d.kind === "agent").every((d) => d.kind === "agent" && d.tools.length === 0)).toBe(true);
    expect(two.notes.some((n) => n.text.includes("No agent can call"))).toBe(true);
  });

  test("remove_decl drops the decl and every reference to it", () => {
    const { spec } = creatorToSpec([toolEvent("t"), agentEvent("a", ["t"]), { kind: "remove", name: "t" }], LOCAL, "j");
    expect(spec.decls.some((d) => d.id === "t")).toBe(false);
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: [] });
  });

  test("finish supplies the project name and entry; without it the build is marked unfinished", () => {
    const withFinish = creatorToSpec([agentEvent("a"), agentEvent("b"), { kind: "finish", name: "Refund desk", entry: "b", summary: "s" }], LOCAL, "j");
    expect(withFinish.spec.name).toBe("Refund desk");
    expect(withFinish.spec.entry.target).toBe("b");
    expect(withFinish.finished).toBe(true);
    expect(withFinish.summary).toBe("s");

    expect(creatorToSpec([agentEvent("a")], LOCAL, "some long job line").finished).toBe(false);
    expect(creatorToSpec([agentEvent("a")], LOCAL, "some long job line").spec.name).toBe("some long job line");
  });

  test("declaration order is already correct — nothing is referenced before it initializes", () => {
    // The creator naturally emits the parent before the specialist it delegates to.
    const { spec } = creatorToSpec(
      [
        agentEvent("router"),
        { kind: "subagent", id: "billing", purpose: "p", instructions: "i", tools: ["lookup"], parent: "router", exposeName: "ask_billing", exposeDescription: "d" },
        toolEvent("lookup"),
        { kind: "attach", tool: "lookup", agent: "billing" },
      ],
      LOCAL,
      "j",
    );
    const at = (id: string): number => spec.decls.findIndex((d) => d.id === id);
    expect(at("lookup")).toBeLessThan(at("billing"));
    expect(at("billing")).toBeLessThan(at("ask_billing"));
    expect(at("ask_billing")).toBeLessThan(at("router"));
  });

  test("empty input yields an empty but still valid project", () => {
    const { spec } = creatorToSpec([], LOCAL, "j");
    expect(spec.decls).toEqual([]);
    expect(spec.entry.target).toBe("");
  });
});

describe("creatorToSpec as an EDIT (with a base)", () => {
  const base = creatorToSpec([toolEvent("get_weather"), agentEvent("assistant", ["get_weather"]), { kind: "finish", name: "Weather desk", entry: "assistant", summary: "s" }], LOCAL, "j").spec;

  test("an untouched decl survives byte-identically", () => {
    const { spec } = creatorToSpec([toolEvent("refund")], LOCAL, "add a refund tool", base);
    expect(spec.decls.find((d) => d.id === "get_weather")).toEqual(base.decls.find((d) => d.id === "get_weather"));
  });

  test("a new tool is added without disturbing the rest", () => {
    const { spec } = creatorToSpec([toolEvent("refund"), { kind: "attach", tool: "refund", agent: "assistant" }], LOCAL, "add a refund tool", base);
    expect(spec.decls.map((d) => d.id).sort()).toEqual(["assistant", "get_weather", "refund"]);
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: ["get_weather", "refund"] });
  });

  test("re-creating an existing tool rewrites it in place", () => {
    const { spec } = creatorToSpec([toolEvent("get_weather", { description: "Now it says when to call." })], LOCAL, "fix the description", base);
    expect(spec.decls.filter((d) => d.kind === "tool")).toHaveLength(1);
    expect(spec.decls.find((d) => d.kind === "tool")).toMatchObject({ id: "get_weather", description: "Now it says when to call." });
    // …and the agent keeps it.
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: ["get_weather"] });
  });

  test("remove_decl deletes and unwires", () => {
    const { spec } = creatorToSpec([{ kind: "remove", name: "get_weather" }], LOCAL, "drop the weather tool", base);
    expect(spec.decls.some((d) => d.id === "get_weather")).toBe(false);
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: [] });
  });

  test("the project keeps its name and entry — the instruction is not a name", () => {
    const { spec } = creatorToSpec([toolEvent("refund")], LOCAL, "add a refund tool", base);
    expect(spec.name).toBe("Weather desk");
    expect(spec.entry.target).toBe("assistant");
  });

  test("an edit never auto-attaches a tool the user deliberately detached", () => {
    const detached: ProjectSpec = { ...base, decls: base.decls.map((d) => (d.kind === "agent" ? { ...d, tools: [] } : d)) };
    const { spec } = creatorToSpec([], LOCAL, "no-op", detached);
    expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ tools: [] });
  });

  test("an edit that emits nothing changes nothing", () => {
    const { spec } = creatorToSpec([], LOCAL, "no-op", base);
    expect(spec).toEqual(base);
  });
});

describe("the keystone: everything the creator builds survives the round-trip", () => {
  const CASES: readonly (readonly [string, readonly CreatorEvent[]])[] = [
    ["one agent, one tool", [toolEvent("get_weather"), agentEvent("assistant", ["get_weather"])]],
    [
      "a router delegating to a specialist",
      [
        toolEvent("lookup_account"),
        agentEvent("assistant"),
        { kind: "subagent", id: "billing", purpose: "p", instructions: "You handle billing.", tools: ["lookup_account"], parent: "assistant", exposeName: "ask_billing", exposeDescription: "For billing." },
        { kind: "finish", name: "Support desk", entry: "assistant", summary: "s" },
      ],
    ],
    ["colliding and reserved names", [toolEvent("groq"), toolEvent("groq"), toolEvent("agent"), agentEvent("tool", ["groq", "agent"])]],
    ["a tool with no inputs and a stubbed body", [toolEvent("ping", { inputs: [], code: "not code" }), agentEvent("a", ["ping"])]],
    ["quotes and newlines in prose", [toolEvent("t", { description: 'He said "hi"\nthen left.\\' }), agentEvent("a", ["t"])]],
  ];

  for (const [label, events] of CASES) {
    test(`parse(generate(spec)) ≡ spec — ${label}`, () => {
      const { spec } = creatorToSpec(events, LOCAL, "job");
      const result = parseProject(generateProject(spec), ts, spec);
      expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(result.opaqueCount).toBe(0); // every decl is structured — no verbatim blocks in the Designer
      expect(result.spec).toEqual(spec);
    });
  }
});
