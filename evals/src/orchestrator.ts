/**
 * The multi-agent orchestrator under evaluation — a faithful port of the complex harness scenario in
 * `scripts/test-openrouter-complex.ts`, wired for the eval provider. It builds a `lead` agent that
 * owns two of its own tools (`get_current_time`, `save_note`) and delegates to two REAL sub-agents via
 * {@link asTool}: a `researcher` (weather / timezone / web search) exposed as `research`, and an
 * `analyst` (arithmetic / currency / average) exposed as `analyze`.
 *
 * The eval measures whether a small local model ROUTES correctly at the top level — does it send facts
 * to `research`, numbers to `analyze`, the clock to `get_current_time`, and a save request to
 * `save_note`? Those are the calls that surface as top-level `tool.call` events; the suite grades them
 * with `expectToolCalls` (see {@link file://./grading.ts}). As in the shared toolset, every `execute`
 * body returns deterministic canned data — the value never matters, only that the right tool is chosen.
 */
import { agent, asTool, tool } from "@mithril/core/agent";
import { transformers } from "@mithril/providers/transformers";
import { z } from "zod";

type Model = ReturnType<typeof transformers>;
// The eval only needs the loose, runtime shape of these tools; the precise per-tool generics don't
// survive `exactOptionalPropertyTypes` variance when mixed into one array (same reason src/tools.ts
// casts its toolset map), so we work against this widened alias.
type LooseTools = readonly ReturnType<typeof tool>[];

// ── deterministic, offline data sources (mirrors the script) ────────────────────────────────────
const WEATHER: Record<string, string> = { Tokyo: "18°C, light rain", Paris: "24°C, sunny", "New York": "21°C, cloudy" };
const TZ: Record<string, string> = { Tokyo: "Asia/Tokyo (UTC+9)", Paris: "Europe/Paris (UTC+2)", "New York": "America/New_York (UTC-4)" };
const FX: Record<string, number> = { USD_JPY: 157.2, USD_EUR: 0.92, USD_GBP: 0.79 };

// ── researcher sub-agent (web_search, get_weather, lookup_timezone) ───────────────────────────────
const webSearch = tool({
  name: "web_search",
  description: "Search the web for a short factual answer to a query.",
  inputSchema: z.object({ query: z.string().describe("the search query") }),
  examples: [{ query: "population of Tokyo" }],
  execute: async ({ query }) => `Top result for "${query}": Tokyo is the capital of Japan; population ~14 million.`,
});

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string().describe("city name") }),
  examples: [{ city: "Tokyo" }],
  execute: async ({ city }) => WEATHER[city] ?? `No weather data for ${city}.`,
});

const lookupTimezone = tool({
  name: "lookup_timezone",
  description: "Look up the timezone of a city.",
  inputSchema: z.object({ city: z.string().describe("city name") }),
  examples: [{ city: "Tokyo" }],
  execute: async ({ city }) => TZ[city] ?? `No timezone data for ${city}.`,
});

function makeResearcher(model: Model) {
  return agent({
    model,
    instructions:
      "You are a research assistant with live data tools. You MUST answer using the tools — never from memory. " +
      "For weather always call get_weather; for timezone always call lookup_timezone; for general facts call web_search. " +
      "Call every tool relevant to the question, then report the tool results verbatim as bullet points.",
    tools: [webSearch, getWeather, lookupTimezone],
  });
}

// ── analyst sub-agent (calculate, convert_currency, average) ──────────────────────────────────────
const calculate = tool({
  name: "calculate",
  description: "Evaluate a basic arithmetic expression (numbers, + - * / and parentheses only).",
  inputSchema: z.object({ expression: z.string().describe("e.g. (100+200)/2") }),
  examples: [{ expression: "314400 / 30" }],
  execute: async ({ expression }) => {
    if (!/^[\d\s+\-*/().]+$/.test(expression)) return "Refused: expression contains illegal characters.";
    try {
      const value = Function(`"use strict"; return (${expression});`)() as unknown;
      return typeof value === "number" && Number.isFinite(value) ? `${expression} = ${value}` : `Could not evaluate "${expression}".`;
    } catch {
      return `Could not evaluate "${expression}".`;
    }
  },
});

const convertCurrency = tool({
  name: "convert_currency",
  description: "Convert an amount from one currency to another (supports USD→JPY, USD→EUR, USD→GBP).",
  inputSchema: z.object({
    amount: z.number().describe("the amount to convert"),
    from: z.string().describe("ISO code, e.g. USD"),
    to: z.string().describe("ISO code, e.g. JPY"),
  }),
  examples: [{ amount: 2000, from: "USD", to: "JPY" }],
  execute: async ({ amount, from, to }) => {
    const rate = FX[`${from}_${to}`];
    if (rate === undefined) return `No FX rate for ${from}→${to}.`;
    return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to} (rate ${rate}).`;
  },
});

const average = tool({
  name: "average",
  description: "Compute the arithmetic mean of a comma-separated list of numbers.",
  inputSchema: z.object({ numbers: z.string().describe("e.g. 100,200,300") }),
  examples: [{ numbers: "150,220,305" }],
  execute: async ({ numbers }) => {
    const xs = numbers.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
    if (xs.length === 0) return "No valid numbers provided.";
    return `average(${xs.join(", ")}) = ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)}`;
  },
});

function makeAnalyst(model: Model) {
  return agent({
    model,
    instructions:
      "You are a numerical analyst. You have NO innate knowledge of exchange rates or arithmetic and WILL be wrong if you answer from memory.\n" +
      "MANDATORY: for a currency/JPY/exchange question call convert_currency; for a mean/average call average; for any other arithmetic (division, multiplication, etc.) call calculate.\n" +
      "If the user asks several things, call ALL the relevant tools (one per sub-question) BEFORE writing any answer. Then report only the tool outputs.",
    tools: [calculate, convertCurrency, average],
  });
}

// ── lead / orchestrator (2 own tools + 2 sub-agents via asTool) ───────────────────────────────────
/** Instructions handed to the top-level lead agent; exported so the provider can use them as the default. */
export const ORCHESTRATOR_INSTRUCTIONS =
  "You are a trip-planning orchestrator. You never answer facts or do math yourself.\n" +
  "ROUTING RULES (follow exactly):\n" +
  "• Weather, timezone, or non-numeric facts → call `research` ONCE with the full question.\n" +
  "• ANY number work — currency conversion, exchange rates, averages, arithmetic, budgets → call `analyze` ONCE with the full question. NEVER send number/currency questions to `research`.\n" +
  "• A question about the current time → call get_current_time.\n" +
  "• A request to save/summarize → call save_note.\n" +
  "Trust the tool outputs and report them. Keep replies short.";

/**
 * Build the `lead` agent's tools for a given model: its two own tools plus the `research` / `analyze`
 * sub-agents. `save_note` writes to a per-build in-memory store (no deps required by the caller), since
 * the eval only cares that the right top-level tool is invoked with plausible arguments.
 */
export function orchestratorTools(model: Model): LooseTools {
  const notes: string[] = [];

  const getCurrentTime = tool({
    name: "get_current_time",
    description: "Get the current UTC date and time.",
    inputSchema: z.object({}),
    execute: async () => "2026-07-23T18:53:00Z (UTC)",
  });

  const saveNote = tool({
    name: "save_note",
    description: "Persist a titled note to the trip planner's note store.",
    inputSchema: z.object({ title: z.string(), body: z.string() }),
    examples: [{ title: "Tokyo Trip", body: "Summary of the plan." }],
    execute: async ({ title, body }) => {
      notes.push(`# ${title}\n${body}`);
      return `Saved note "${title}" (store now holds ${notes.length} note(s)).`;
    },
  });

  return [
    getCurrentTime,
    saveNote,
    // The precise sub-agent generics don't line up with asTool's loose parameter under
    // `exactOptionalPropertyTypes`; the runtime shape is correct, so we widen at the call boundary.
    asTool(makeResearcher(model) as never, {
      name: "research",
      description: "Look up NON-numeric facts only: weather, timezone, general knowledge. Never use for math or currency.",
    }),
    asTool(makeAnalyst(model) as never, {
      name: "analyze",
      description: "Do ALL number work here: currency conversion, exchange rates, averages, and arithmetic. Pass the full numeric question.",
    }),
  ] as unknown as LooseTools;
}
