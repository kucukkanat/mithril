/*
 * The load-bearing invariant of the two-way code view: for any spec s,
 * `parseProject(generateProject(s), ts, s).spec` deep-equals `s` — including opaque verbatim
 * regions, which must survive byte-identically. The corpus below exercises every recognized
 * shape (M1 scope: tools, agents, entry, opaque) plus the degradation paths.
 */
import { describe, expect, test } from "bun:test";
import * as ts from "typescript";
import { generateProject } from "../src/codegen.ts";
import { parseProject } from "../src/parse.ts";
import { SPEC_VERSION, type ProjectSpec } from "../src/types.ts";

const roundtrip = (spec: ProjectSpec) => parseProject(generateProject(spec), ts, spec);

const WEATHER_TOOL = {
  kind: "tool",
  id: "weather",
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: { zod: `z.object({ city: z.string() })` },
  execute: { code: `async ({ city }) => ({ city, tempC: 21 })` },
} as const;

const CORPUS: readonly (readonly [string, ProjectSpec])[] = [
  [
    "minimal agent, live openai model, string input",
    {
      specVersion: SPEC_VERSION,
      name: "minimal",
      decls: [
        WEATHER_TOOL,
        {
          kind: "agent",
          id: "assistant",
          model: { kind: "live", provider: "openai", model: "gpt-4o-mini" },
          instructions: "You are a concise weather assistant.",
          tools: ["weather"],
        },
      ],
      entry: { target: "assistant", input: "What's the weather in Istanbul?" },
    },
  ],
  [
    "every agent knob + fn instructions + use middlewares + output schema",
    {
      specVersion: SPEC_VERSION,
      name: "knobs",
      decls: [
        {
          kind: "tool",
          id: "deploy",
          name: "deploy",
          description: "Deploy the app.",
          inputSchema: { zod: `z.object({ env: z.string() })` },
          outputSchema: { zod: `z.object({ deployed: z.boolean() })` },
          examples: [{ env: "staging" }],
          needsApproval: true,
          execute: { code: `async ({ env }) => ({ deployed: true, env })` },
        },
        {
          kind: "tool",
          id: "audit",
          name: "audit",
          description: "Audit an env.",
          inputSchema: { zod: `z.object({ env: z.string() })` },
          needsApproval: { code: `(input) => input.env === "production"` },
          execute: { code: `async ({ env }) => "ok: " + env` },
        },
        {
          kind: "agent",
          id: "ops",
          model: { kind: "live", provider: "anthropic", model: "claude-3-5-haiku-latest" },
          instructions: { code: `(ctx) => \`Deploy for \${ctx.deps === undefined ? "anon" : "user"}.\`` },
          tools: ["deploy", "audit"],
          output: { zod: `z.object({ summary: z.string() })` },
          maxSteps: 8,
          outputRetries: 1,
          toolRetries: 3,
          loopDetection: false,
          maxTokens: 4096,
          maxCostMicroUsd: 250_000,
          repair: true,
          selfCorrection: false,
          use: [{ code: `bestOfN({ n: 3, score: (r) => r.text.length })` }],
        },
      ],
      entry: { target: "ops", input: "Deploy to production." },
    },
  ],
  [
    "groq model (shared provider const) + messages input",
    {
      specVersion: SPEC_VERSION,
      name: "groq-chat",
      decls: [
        {
          kind: "agent",
          id: "chat",
          model: { kind: "live", provider: "groq", model: "llama-3.3-70b-versatile" },
          instructions: "Chat briefly.",
          tools: [],
        },
      ],
      entry: {
        target: "chat",
        input: [
          { role: "user", content: "hi" },
          { role: "assistant", content: "hello!" },
          { role: "user", content: "what's mithril?" },
        ],
      },
    },
  ],
  [
    "local model with dtype pin + local model without",
    {
      specVersion: SPEC_VERSION,
      name: "local",
      decls: [
        {
          kind: "agent",
          id: "onDevice",
          model: { kind: "local", model: "onnx-community/Qwen3-4B-ONNX", dtype: "q4f16" },
          instructions: "Answer briefly.",
          tools: [],
        },
        {
          kind: "agent",
          id: "onDeviceDefault",
          model: { kind: "local", model: "onnx-community/Qwen3-0.6B-ONNX" },
          instructions: "Answer briefly.",
          tools: [],
        },
      ],
      entry: { target: "onDevice", input: "hello" },
    },
  ],
  [
    "code-region model escape hatch",
    {
      specVersion: SPEC_VERSION,
      name: "custom-model",
      decls: [
        {
          kind: "agent",
          id: "custom",
          model: { kind: "code", expr: { code: `myModelHandle` } },
          instructions: "hi",
          tools: [],
        },
      ],
      entry: { target: "custom", input: "hello" },
    },
  ],
  [
    "opaque decls survive byte-identically (comments included)",
    {
      specVersion: SPEC_VERSION,
      name: "opaque",
      decls: [
        {
          kind: "opaque",
          id: "o1",
          code: `// A hand-written helper the recognizer has no shape for.\nconst rng = { roll: () => 4 };`,
        },
        {
          kind: "agent",
          id: "gamer",
          model: { kind: "live", provider: "google", model: "gemini-2.0-flash" },
          instructions: "Roll dice.",
          tools: [],
        },
        { kind: "opaque", id: "o2", code: `console.log(rng.roll());` },
      ],
      entry: { target: "gamer", input: "roll" },
    },
  ],
  [
    "meta carried through prev",
    {
      specVersion: SPEC_VERSION,
      name: "with-meta",
      decls: [
        WEATHER_TOOL,
        {
          kind: "agent",
          id: "assistant",
          model: { kind: "live", provider: "openai", model: "gpt-4o-mini" },
          instructions: "Weather help.",
          tools: ["weather"],
        },
      ],
      entry: { target: "assistant", input: "Weather in Paris?" },
      meta: { layout: { assistant: { x: 100, y: 40 }, weather: { x: 320, y: 40 } } },
    },
  ],
];

describe("spec round-trip", () => {
  for (const [label, spec] of CORPUS) {
    test(`parse(generate(spec)) ≡ spec — ${label}`, () => {
      const result = roundtrip(spec);
      expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
      expect(result.spec).toEqual(spec);
    });
  }

  test("codegen is deterministic (same spec → byte-identical code)", () => {
    const [, spec] = CORPUS[1]!;
    expect(generateProject(spec)).toBe(generateProject(spec));
  });

  test("second-generation stability: generate(parse(generate(s))) === generate(s)", () => {
    for (const [, spec] of CORPUS) {
      const code = generateProject(spec);
      const reparsed = parseProject(code, ts, spec).spec;
      expect(reparsed).toBeDefined();
      expect(generateProject(reparsed as ProjectSpec)).toBe(code);
    }
  });
});

describe("degradation & diagnostics", () => {
  const PREV = CORPUS[0]![1];

  test("hand-written unknown statements become opaque and survive regeneration", () => {
    const code = generateProject(PREV);
    const edited = `${code}\n// my helper\nfunction shout(s: string) { return s.toUpperCase(); }\n`;
    const result = parseProject(edited, ts, PREV);
    expect(result.spec).toBeDefined();
    expect(result.opaqueCount).toBe(1);
    const regenerated = generateProject(result.spec as ProjectSpec);
    expect(regenerated).toContain(`// my helper\nfunction shout(s: string) { return s.toUpperCase(); }`);
  });

  test("an unrecognized agent property degrades the WHOLE statement to opaque (nothing dropped)", () => {
    const code = `import { agent } from "mithril";

const a = agent({
  model: openai("gpt-4o-mini"),
  instructions: "hi",
  totallyUnknownOption: 42,
});

await run(a, "hello");
`;
    const result = parseProject(code, ts);
    expect(result.spec).toBeDefined();
    // Two opaques: the agent statement AND its import (which codegen won't regenerate).
    expect(result.opaqueCount).toBe(2);
    const opaques = (result.spec as ProjectSpec).decls.filter((d) => d.kind === "opaque");
    expect(opaques.some((d) => d.code.includes("totallyUnknownOption: 42"))).toBe(true);
  });

  test("self-heal: reparsing code that calls agent() without importing it restores the import", () => {
    // The failure mode a stale spec hit: an older parser dropped the mithril import while leaving
    // `agent(...)` as code. Reparsing through the current parser must re-structure the agent and
    // regenerate the missing import — otherwise the generated code throws `agent is not defined`.
    const broken = `import { scriptedProvider, testModel } from "@mithril/core/testkit";

const model = testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }]]));

const assistant = agent({
  model,
  instructions: "Say hello.",
});

await run(assistant, "hello");
`;
    expect(broken).not.toContain(`from "mithril"`); // precondition: the import is genuinely absent
    const result = parseProject(broken, ts);
    expect(result.spec).toBeDefined();
    const healed = generateProject(result.spec as ProjectSpec);
    expect(healed).toContain(`import { agent } from "mithril";`);
    // Idempotent: the healed code is now self-consistent (reparse → same generated code).
    expect(generateProject(parseProject(healed, ts, result.spec).spec as ProjectSpec)).toBe(healed);
  });

  test("syntax errors freeze the spec (undefined) with positioned diagnostics", () => {
    const result = parseProject(`const x = {`, ts);
    expect(result.spec).toBeUndefined();
    expect(result.diagnostics.some((d) => d.severity === "error")).toBe(true);
  });

  test("a missing entry is an error diagnostic, not a guess", () => {
    const result = parseProject(`const n = 1;`, ts);
    expect(result.spec).toBeUndefined();
    expect(result.diagnostics.at(-1)?.message).toContain("No entry found");
  });

  test("shorthand properties parse (agent stays structured, model becomes a code region)", () => {
    const code = `import { agent } from "mithril";
import { scriptedProvider, testModel } from "@mithril/core/testkit";

const model = testModel(scriptedProvider([[{ type: "text.delta", delta: "hi" }]]));

const assistant = agent({
  model,
  instructions: "Say hello.",
});

await run(assistant, "hello");
`;
    const result = parseProject(code, ts);
    expect(result.spec).toBeDefined();
    const spec2 = result.spec as ProjectSpec;
    const agents = spec2.decls.filter((d) => d.kind === "agent");
    expect(agents).toHaveLength(1);
    expect(agents[0]?.model).toEqual({ kind: "code", expr: { code: "model" } });
    // The testkit import + model const stay verbatim; canonicalized code still runs.
    expect(result.opaqueCount).toBe(2);
    const regenerated = generateProject(spec2);
    expect(regenerated).toContain(`import { scriptedProvider, testModel } from "@mithril/core/testkit";`);
    expect(regenerated).toContain(`model: model,`);
  });

  test("an import consumed only by an OPAQUE decl is preserved (not absorbed)", () => {
    // The agent statement degrades to opaque (unknown prop) — so codegen won't plan an
    // `agent` import, and the parser must keep the original import statement verbatim.
    const code = `import { agent } from "mithril";

const a = agent({
  model: openai("gpt-4o-mini"),
  instructions: "hi",
  totallyUnknownOption: 42,
});

await run(a, "x");
`;
    const result = parseProject(code, ts);
    expect(result.spec).toBeDefined();
    const regenerated = generateProject(result.spec as ProjectSpec);
    expect(regenerated).toContain(`import { agent } from "mithril";`);
  });

  test("imports with bindings codegen can't regenerate stay opaque", () => {
    const code = `import { agent, agentLoop } from "mithril";\n\nconst a = agent({\n  model: openai("gpt-4o-mini"),\n  instructions: "hi",\n});\n\nawait run(a, "x");\n`;
    const result = parseProject(code, ts);
    expect(result.spec).toBeDefined();
    const opaques = (result.spec as ProjectSpec).decls.filter((d) => d.kind === "opaque");
    expect(opaques.some((d) => d.code.includes("agentLoop"))).toBe(true);
  });
});
