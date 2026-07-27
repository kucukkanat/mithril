import { describe, expect, test } from "bun:test";
import type { ModelSpec } from "@mithril/spec";
import {
  DRAFT_DEFAULT_MODEL,
  DRAFT_LOCAL_MODEL,
  draftDestination,
  draftModelLabel,
  draftProgram,
  draftToSpec,
  inputsToZod,
  parseDescriptionDraft,
  parseSpecDraft,
  promptFor,
  safeIdent,
  type SpecDraft,
} from "../src/lib/drafting.ts";

const specReq = { kind: "spec" as const, job: "Answer weather questions", cases: ["What's the weather in Oslo?", "  ", "Is it raining?"] };
const descReq = { kind: "description" as const, toolName: "weather", current: "Current conditions for a city", job: "Answer weather questions", inputNames: ["city"] };
const CLOUD: ModelSpec = { kind: "live", provider: "anthropic", model: "claude-sonnet-4-5" };

describe("promptFor", () => {
  test("a spec request carries the job and the non-empty examples", () => {
    const p = promptFor(specReq);
    expect(p).toContain("Answer weather questions");
    expect(p).toContain("1. What's the weather in Oslo?");
    expect(p).toContain("2. Is it raining?");
    expect(p).not.toContain("3."); // the blank case is dropped, not numbered
  });

  test("a spec request with no examples omits the examples block entirely", () => {
    expect(promptFor({ ...specReq, cases: [] })).not.toContain("must handle these examples");
  });

  test("a description request includes the current text and the owning job", () => {
    const p = promptFor(descReq);
    expect(p).toContain("Current conditions for a city");
    expect(p).toContain("Answer weather questions");
    // Was: expect(p).toContain("WHEN to call it"). Asking the drafting model to name the TRIGGER is what
    // produced "When preparing for meetings, call the calendar reader" — read by a real model as a
    // precondition it had not met, so it never called. The prompt now asks for returns-framing and arity.
    expect(p).toContain("RETURNS");
    expect(p).not.toContain("WHEN to call it");
    expect(p).toContain("`city`");
  });

  test("an over-long case is clipped rather than sent whole", () => {
    const p = promptFor({ ...specReq, cases: ["x".repeat(400)] });
    expect(p).toContain("…");
    expect(p.length).toBeLessThan(400 + 500);
  });
});

describe("draftProgram", () => {
  test("the program embeds the exact prompt the gate previewed", () => {
    const program = draftProgram(descReq, DRAFT_DEFAULT_MODEL);
    expect(program).toContain(JSON.stringify(promptFor(descReq)));
  });

  test("an on-device model imports transformers and names the repo", () => {
    const program = draftProgram(specReq, DRAFT_DEFAULT_MODEL);
    expect(program).toContain(`import { transformers } from "mithril/transformers"`);
    expect(program).toContain(DRAFT_LOCAL_MODEL);
    expect(program).not.toContain("anthropic");
  });

  test("a cloud model imports its provider instead", () => {
    const program = draftProgram(specReq, CLOUD);
    expect(program).toContain(`import { anthropic } from "mithril/anthropic"`);
    expect(program).toContain(`anthropic("claude-sonnet-4-5")`);
    expect(program).not.toContain("transformers");
  });

  test("groq is reached through the openai-compatible provider const, as generated code does", () => {
    const program = draftProgram(specReq, { kind: "live", provider: "groq", model: "llama-3.3-70b-versatile" });
    expect(program).toContain("openaiProvider");
    expect(program).toContain(`groq/llama-3.3-70b-versatile`);
  });

  test("a verbatim code model is passed through with no provider import", () => {
    const program = draftProgram(specReq, { kind: "code", expr: { code: "myModel" } });
    expect(program).toContain("model: myModel,");
    expect(program).not.toContain("mithril/anthropic");
  });

  test("run is the runner's injected global, never an import — importing it shadows it with undefined", () => {
    const program = draftProgram(specReq, DRAFT_DEFAULT_MODEL);
    expect(program).toContain(`import { agent } from "mithril";`);
    expect(program).not.toContain("agent, run");
    expect(program).toContain("await run(drafter,");
  });

  test("tools is a LIST — an object literal is not iterable and crashes the loop", () => {
    expect(draftProgram(specReq, DRAFT_DEFAULT_MODEL)).toContain("tools: [],");
    expect(draftProgram(specReq, DRAFT_DEFAULT_MODEL)).not.toContain("tools: {}");
  });

  test("each request kind asks for its own output schema", () => {
    expect(draftProgram(specReq, DRAFT_DEFAULT_MODEL)).toContain("instructions: z.string()");
    expect(draftProgram(descReq, DRAFT_DEFAULT_MODEL)).toContain("z.object({ description: z.string() })");
  });
});

describe("draftDestination", () => {
  test("an on-device model promises nothing leaves the browser", () => {
    expect(draftDestination(DRAFT_DEFAULT_MODEL)).toContain("nothing leaves this browser");
  });

  test("a cloud model names the host it reaches", () => {
    expect(draftDestination(CLOUD)).toContain("api.anthropic.com");
  });

  test("a verbatim expression makes no claim about where it goes", () => {
    expect(draftDestination({ kind: "code", expr: { code: "myModel" } })).toBe("the model expression you supplied");
  });
});

describe("draftModelLabel", () => {
  test("names the catalog model, not its repo id", () => {
    expect(draftModelLabel({ kind: "local", model: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX" })).toBe("LFM2.5 1.2B · on-device");
  });

  test("falls back to the raw repo id for a model outside the catalog", () => {
    expect(draftModelLabel({ kind: "local", model: "someone/their-model-ONNX" })).toBe("someone/their-model-ONNX · on-device");
  });

  test("a cloud model reads as the model plus who runs it", () => {
    expect(draftModelLabel(CLOUD)).toBe("claude-sonnet-4-5 · Anthropic");
  });

  test("a verbatim expression is marked custom", () => {
    expect(draftModelLabel({ kind: "code", expr: { code: "myModel" } })).toBe("myModel · custom");
  });

  test("drafting switched off says so rather than naming a model", () => {
    expect(draftModelLabel(null)).toBe("drafting off");
  });

  test("a half-typed custom repo reads as blank instead of an empty chip", () => {
    expect(draftModelLabel({ kind: "local", model: "" })).toBe("no model · on-device");
    expect(draftModelLabel({ kind: "live", provider: "openai", model: "  " })).toBe("no model · OpenAI");
  });
});

describe("parseSpecDraft", () => {
  test("accepts a well-formed draft", () => {
    const d = parseSpecDraft({
      name: "Weather agent",
      instructions: "Answer weather questions in one sentence.",
      tool: { name: "get_weather", description: "Use when asked about current weather.", inputs: [{ name: "city", type: "text", description: "e.g. Oslo" }] },
    });
    expect(d?.name).toBe("Weather agent");
    expect(d?.tool?.inputs).toEqual([{ name: "city", type: "text", description: "e.g. Oslo" }]);
  });

  test("rejects a draft with no instructions — there would be nothing to apply", () => {
    expect(parseSpecDraft({ name: "x", instructions: "   ", tool: null })).toBeNull();
    expect(parseSpecDraft({ name: "x" })).toBeNull();
  });

  test("rejects non-objects rather than throwing", () => {
    expect(parseSpecDraft("nope")).toBeNull();
    expect(parseSpecDraft(null)).toBeNull();
    expect(parseSpecDraft([1, 2])).toBeNull();
  });

  test("a missing name falls back rather than failing the whole draft", () => {
    expect(parseSpecDraft({ instructions: "Do the thing." })?.name).toBe("Untitled agent");
  });

  test("a malformed tool degrades to no tool", () => {
    expect(parseSpecDraft({ instructions: "x.", tool: { description: "no name" } })?.tool).toBeNull();
    expect(parseSpecDraft({ instructions: "x.", tool: "weather" })?.tool).toBeNull();
  });

  test("unusable inputs are dropped and unknown types default to text", () => {
    const d = parseSpecDraft({
      instructions: "x.",
      tool: { name: "t", description: "d", inputs: [{ name: "a", type: "wat" }, { type: "text" }, "junk", { name: "b", type: "number" }] },
    });
    expect(d?.tool?.inputs).toEqual([
      { name: "a", type: "text", description: "" },
      { name: "b", type: "number", description: "" },
    ]);
  });
});

describe("parseDescriptionDraft", () => {
  test("accepts a non-empty description and trims it", () => {
    expect(parseDescriptionDraft({ description: "  Use when asked.  " })).toEqual({ description: "Use when asked." });
  });

  test("rejects empty or malformed payloads", () => {
    expect(parseDescriptionDraft({ description: "" })).toBeNull();
    expect(parseDescriptionDraft({})).toBeNull();
    expect(parseDescriptionDraft("text")).toBeNull();
  });
});

describe("safeIdent", () => {
  test("normalises to snake_case", () => {
    expect(safeIdent("Get Current Weather", "x")).toBe("get_current_weather");
    expect(safeIdent("get-weather!", "x")).toBe("get_weather");
  });

  test("never produces a leading digit or empty identifier", () => {
    expect(safeIdent("2fast", "x")).toBe("_2fast");
    expect(safeIdent("!!!", "fallback")).toBe("fallback");
    expect(safeIdent("   ", "fallback")).toBe("fallback");
  });
});

describe("inputsToZod", () => {
  test("maps each type and attaches descriptions", () => {
    expect(inputsToZod([{ name: "city", type: "text", description: "e.g. Oslo" }])).toBe(`z.object({ city: z.string().describe("e.g. Oslo") })`);
    expect(inputsToZod([{ name: "n", type: "number", description: "" }])).toBe("z.object({ n: z.number() })");
    expect(inputsToZod([{ name: "b", type: "boolean", description: "" }])).toBe("z.object({ b: z.boolean() })");
  });

  test("no inputs is a valid empty object", () => {
    expect(inputsToZod([])).toBe("z.object({})");
  });
});

describe("draftToSpec", () => {
  const draft: SpecDraft = {
    name: "Weather agent",
    instructions: "Answer weather questions in one sentence.",
    tool: { name: "Get Weather", description: "Use when asked about current weather.", inputs: [{ name: "city", type: "text", description: "e.g. Oslo" }] },
  };

  test("produces a runnable spec with the tool attached to the agent", () => {
    const spec = draftToSpec(draft);
    const agent = spec.decls.find((d) => d.kind === "agent");
    expect(agent?.kind === "agent" && agent.tools).toEqual(["get_weather"]);
    expect(spec.entry.target).toBe("assistant");
    expect(spec.name).toBe("Weather agent");
  });

  test("the drafted agent defaults to the on-device model so it needs no key", () => {
    const agent = draftToSpec(draft).decls.find((d) => d.kind === "agent");
    expect(agent?.kind === "agent" && agent.model).toEqual({ kind: "local", model: DRAFT_LOCAL_MODEL });
  });

  test("the drafted agent runs on whichever model drafted it", () => {
    const agent = draftToSpec(draft, CLOUD).decls.find((d) => d.kind === "agent");
    expect(agent?.kind === "agent" && agent.model).toEqual(CLOUD);
  });

  test("the tool body is an honest placeholder, never invented network code", () => {
    const tool = draftToSpec(draft).decls.find((d) => d.kind === "tool");
    expect(tool?.kind === "tool" && tool.execute.code).toContain("TODO");
    expect(tool?.kind === "tool" && tool.execute.code).not.toContain("fetch");
  });

  test("the placeholder destructures exactly the drafted inputs", () => {
    const tool = draftToSpec(draft).decls.find((d) => d.kind === "tool");
    expect(tool?.kind === "tool" && tool.execute.code).toContain("async ({ city })");
  });

  test("a toolless draft yields just the agent", () => {
    const spec = draftToSpec({ ...draft, tool: null });
    expect(spec.decls).toHaveLength(1);
    expect(spec.decls[0]?.kind).toBe("agent");
  });
});
