/*
 * Shared eval scenarios + scorers for the local-model suite. A scenario is provider-agnostic — it's
 * run against each model in suite.ts. The multi-tool scenarios are the interesting ones for small local
 * models: choosing the right tool among six, chaining two calls, and passing the right arguments.
 */
import { tool } from "@mithril/core/agent";
import type { AnyTool, StandardSchemaV1 } from "@mithril/core/protocol";
import { calledTool, calledToolWith, completed, type Scorer } from "@mithril/evals";

// A minimal Standard Schema (any validator works — zod, valibot, arktype); this keeps the suite dep-free.
function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "evals-suite", validate: (v) => ({ value: v as T }) } };
}

// ── the toolbox: six tools the model must choose among ───────────────────────────────────────────────────
export const getWeather = tool({
  name: "getWeather",
  description: "Get the current weather for a city.",
  inputSchema: schema<{ city: string }>(),
  execute: async ({ city }) => ({ city, tempC: 21, sky: "clear" }),
});
const calculate = tool({
  name: "calculate",
  description: "Evaluate an arithmetic expression (tips, totals, percentages).",
  inputSchema: schema<{ expression: string }>(),
  execute: async ({ expression }) => ({ expression, result: 0 }),
});
const convertCurrency = tool({
  name: "convertCurrency",
  description: "Convert an amount from one currency to another.",
  inputSchema: schema<{ amount: number; from: string; to: string }>(),
  execute: async ({ amount, from, to }) => ({ amount, from, to, result: amount }),
});
const getLocalTime = tool({
  name: "getLocalTime",
  description: "Get the current local time in a city.",
  inputSchema: schema<{ city: string }>(),
  execute: async ({ city }) => ({ city, time: "14:30" }),
});
const searchWeb = tool({
  name: "searchWeb",
  description: "Search the web for a query.",
  inputSchema: schema<{ query: string }>(),
  execute: async ({ query }) => ({ query, results: ["result A", "result B"] }),
});
const translate = tool({
  name: "translate",
  description: "Translate text into a target language.",
  inputSchema: schema<{ text: string; to: string }>(),
  execute: async ({ text, to }) => ({ text, to, translated: text }),
});

/** All six tools — the multi-tool scenarios expose the whole set so the model has to choose. */
export const TOOLBOX: readonly AnyTool<void>[] = [getWeather, calculate, convertCurrency, getLocalTime, searchWeb, translate];

// ── scorers ──────────────────────────────────────────────────────────────────────────────────────────────
/** Scores 1 when the assistant produced any non-empty text. */
const nonEmptyAnswer: Scorer = (t) => {
  const text = t.log
    .filter((e) => e.type === "text.delta")
    .map((e) => (e as unknown as { delta: string }).delta)
    .join("");
  return { name: "non-empty-answer", value: text.trim().length > 0 ? 1 : 0, rationale: text.slice(0, 140) };
};

// ── scenarios ────────────────────────────────────────────────────────────────────────────────────────────
export interface Scenario {
  readonly name: string;
  readonly input: string;
  readonly instructions: string;
  /** `none` → no tools; `single` → just `getWeather`; `multi` → the whole {@link TOOLBOX}. */
  readonly toolset: "none" | "single" | "multi";
  readonly scorers: readonly Scorer[];
}

const TOOL_INSTR = "You are a helpful assistant. Use the provided tools to answer; call a tool rather than guessing.";

export const SCENARIOS: readonly Scenario[] = [
  {
    name: "chat",
    input: "Say hello and give one fun fact, in two sentences.",
    instructions: "You are a brief, friendly assistant.",
    toolset: "none",
    scorers: [completed(), nonEmptyAnswer],
  },
  {
    name: "tool-call",
    input: "What's the weather in Istanbul?",
    instructions: "Use the weather tool to answer weather questions.",
    toolset: "single",
    scorers: [completed(), calledTool("getWeather")],
  },
  {
    // Right tool among six.
    name: "tool-select",
    input: "Use a tool to compute a 15% tip on an $80 bill.",
    instructions: TOOL_INSTR,
    toolset: "multi",
    scorers: [completed(), calledTool("calculate")],
  },
  {
    // Two tools in one turn.
    name: "multi-tool",
    input: "Tell me the weather in Tokyo and the current local time there.",
    instructions: TOOL_INSTR,
    toolset: "multi",
    scorers: [completed(), calledTool("getWeather"), calledTool("getLocalTime")],
  },
  {
    // Right tool AND right arguments.
    name: "tool-args",
    input: "Convert 100 US dollars (USD) to euros (EUR).",
    instructions: TOOL_INSTR,
    toolset: "multi",
    scorers: [completed(), calledToolWith("convertCurrency", (i) => (i as { amount?: number }).amount === 100)],
  },
];
