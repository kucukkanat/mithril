/**
 * Shared tool definitions for the tool-calling suites. These are REAL Mithril tools wired into the
 * agent under test — the eval measures whether a small local model selects the right tool and fills
 * its arguments correctly, so the `execute` bodies return deterministic canned data (the values don't
 * matter; the call does). A suite test picks a set by name via its `toolset` var; {@link toolset}
 * resolves that name to the tool array handed to `agent({ tools })`.
 */
import { tool } from "@mithril/core/agent";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string().describe("City name, e.g. 'Paris'") }),
  examples: [{ city: "Paris" }],
  execute: async ({ city }) => ({ city, tempC: 21, conditions: "clear" }),
});

const calculate = tool({
  name: "calculate",
  description: "Evaluate a basic arithmetic expression (+, -, *, /) and return the number.",
  inputSchema: z.object({ expression: z.string().describe("An arithmetic expression, e.g. '15 * 23'") }),
  examples: [{ expression: "15 * 23" }],
  execute: async ({ expression }) => ({ expression, result: safeArithmetic(expression) }),
});

const searchDocs = tool({
  name: "search_docs",
  description: "Search the documentation for a query and return the best matching snippet.",
  inputSchema: z.object({ query: z.string().describe("What to look up") }),
  examples: [{ query: "how to stream events" }],
  execute: async ({ query }) => ({ query, snippet: `Docs result for: ${query}` }),
});

const convertCurrency = tool({
  name: "convert_currency",
  description: "Convert an amount of money from one currency to another.",
  inputSchema: z.object({
    amount: z.number().describe("The amount to convert"),
    from: z.string().describe("ISO currency code to convert from, e.g. 'USD'"),
    to: z.string().describe("ISO currency code to convert to, e.g. 'EUR'"),
  }),
  examples: [{ amount: 100, from: "USD", to: "EUR" }],
  execute: async ({ amount, from, to }) => ({ amount, from, to, converted: amount * 0.9 }),
});

/** The named tool sets a suite test can request via its `toolset` var. */
const TOOLSETS = {
  weather: [getWeather],
  math: [calculate],
  search: [searchDocs],
  multi: [getWeather, calculate, searchDocs, convertCurrency],
} as const;

/** Resolve a `toolset` var to the tool array for `agent({ tools })`; unknown/empty ⇒ no tools. */
export function toolset(name: unknown): readonly ReturnType<typeof tool>[] {
  if (typeof name !== "string") return [];
  const set = (TOOLSETS as Record<string, readonly ReturnType<typeof tool>[]>)[name];
  return set ?? [];
}

// A tiny, dependency-free arithmetic evaluator (digits, spaces, + - * / . and parens only) so the
// `calculate` tool returns a real answer without pulling in a parser or using `eval` on free text.
function safeArithmetic(expr: string): number | null {
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
