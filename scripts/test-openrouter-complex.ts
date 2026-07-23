/**
 * Complex Mithril harness smoke test against OpenRouter.
 *
 *   Run from the repo root:
 *     bun --env-file=.env run scripts/test-openrouter-complex.ts
 *   (or make sure OPENROUTER_API_KEY is exported in the environment)
 *
 * Exercises, in one run:
 *   • 3 agents  — a `researcher`, an `analyst`, and an orchestrating `lead`.
 *   • 8 tools   — web_search, get_weather, lookup_timezone (researcher);
 *                 calculate, convert_currency, average          (analyst);
 *                 get_current_time, save_note                   (lead, save_note is deps-backed).
 *   • 2 sub-agent delegations — the lead calls `research` and `analyze` via asTool().
 *   • 3 conversation turns — history is threaded back into each following run.
 *
 * Zero extra dependencies: tool schemas are hand-written Standard Schemas made self-describing
 * with `withJsonSchema`, so the script only imports the workspace `mithril` packages.
 */
import { agent, asTool, tool, withJsonSchema } from "mithril";
import type { StandardSchemaV1, InputMessage, JsonSchema } from "mithril";
import { openaiProvider } from "mithril/openai";

// ── config ──────────────────────────────────────────────────────────────────────────────────────
const apiKey = process.env["OPENROUTER_API_KEY"];
if (!apiKey) throw new Error("OPENROUTER_API_KEY not set (export it or use bun --env-file=.env)");

// asTool() runs sub-agents WITHOUT forwarding the parent's transport, so nested runs fall back to
// env BYOK: `<PROVIDER>_API_KEY` for the model's provider segment ("openai" here). Expose the OpenRouter
// key under OPENAI_API_KEY so the researcher/analyst sub-agents authenticate too.
process.env["OPENAI_API_KEY"] = apiKey;

// OpenRouter is OpenAI-wire-compatible. The OpenAI provider slices the model id after the first "/",
// so an "openai/" handle prefix + the real OpenRouter id "openai/gpt-oss-20b" sends "openai/gpt-oss-20b".
const provider = openaiProvider({ baseUrl: "https://openrouter.ai/api/v1" });
const model = { id: "openai/openai/gpt-oss-20b", provider };
const transport = { kind: "byok", apiKey } as const;

// ── a tiny, dependency-free schema helper ─────────────────────────────────────────────────────────
type FieldType = "string" | "number";
type Fields = Record<string, { type: FieldType; description?: string }>;

/** Build a self-describing object Standard Schema (validates + carries real JSON Schema for the model). */
function object<T>(fields: Fields, required: readonly string[]): StandardSchemaV1<unknown, T> {
  const jsonSchema: JsonSchema = {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(fields).map(([k, f]) => [k, { type: f.type, ...(f.description ? { description: f.description } : {}) }]),
    ),
    required: [...required],
    additionalProperties: false,
  };
  const schema: StandardSchemaV1<unknown, T> = {
    "~standard": {
      version: 1,
      vendor: "mithril-test",
      validate(value: unknown): StandardSchemaV1.Result<T> {
        if (typeof value !== "object" || value === null) return { issues: [{ message: "expected an object" }] };
        const v = { ...(value as Record<string, unknown>) };
        for (const key of required) {
          const want = fields[key]?.type;
          const got = v[key];
          if (want === "number" && typeof got !== "number") {
            const n = Number(got);
            if (Number.isNaN(n)) return { issues: [{ message: `field "${key}" must be a number`, path: [key] }] };
            v[key] = n;
          } else if (want === "string" && typeof got !== "string") {
            return { issues: [{ message: `field "${key}" must be a string`, path: [key] }] };
          }
        }
        return { value: v as T };
      },
    },
  };
  return withJsonSchema(schema, jsonSchema);
}

// ── fake data sources (deterministic, offline) ──────────────────────────────────────────────────
const toolsFired = new Set<string>();
const fired = (name: string): void => void toolsFired.add(name);
const ALL_TOOLS = ["web_search", "get_weather", "lookup_timezone", "calculate", "convert_currency", "average", "get_current_time", "save_note"] as const;

const WEATHER: Record<string, string> = { Tokyo: "18°C, light rain", Paris: "24°C, sunny", "New York": "21°C, cloudy" };
const TZ: Record<string, string> = { Tokyo: "Asia/Tokyo (UTC+9)", Paris: "Europe/Paris (UTC+2)", "New York": "America/New_York (UTC-4)" };
const FX: Record<string, number> = { USD_JPY: 157.2, USD_EUR: 0.92, USD_GBP: 0.79 };

// ── agent 1: researcher (3 tools) ────────────────────────────────────────────────────────────────
const webSearch = tool({
  name: "web_search",
  description: "Search the web for a short factual answer to a query.",
  inputSchema: object<{ query: string }>({ query: { type: "string", description: "the search query" } }, ["query"]),
  async execute({ query }) {
    console.log(`    · web_search("${query}")`);
    return `Top result for "${query}": Tokyo is the capital of Japan; population ~14 million.`;
  },
});

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: object<{ city: string }>({ city: { type: "string", description: "city name" } }, ["city"]),
  async execute({ city }) {
    console.log(`    · get_weather("${city}")`);
    return WEATHER[city] ?? `No weather data for ${city}.`;
  },
});

const lookupTimezone = tool({
  name: "lookup_timezone",
  description: "Look up the timezone of a city.",
  inputSchema: object<{ city: string }>({ city: { type: "string", description: "city name" } }, ["city"]),
  async execute({ city }) {
    console.log(`    · lookup_timezone("${city}")`);
    return TZ[city] ?? `No timezone data for ${city}.`;
  },
});

const researcher = agent({
  model,
  instructions:
    "You are a research assistant with live data tools. You MUST answer using the tools — never from memory. " +
    "For weather always call get_weather; for timezone always call lookup_timezone; for general facts call web_search. " +
    "Call every tool relevant to the question, then report the tool results verbatim as bullet points.",
  tools: [webSearch, getWeather, lookupTimezone],
});

// ── agent 2: analyst (3 tools) ────────────────────────────────────────────────────────────────────
const calculate = tool({
  name: "calculate",
  description: "Evaluate a basic arithmetic expression (numbers, + - * / and parentheses only).",
  inputSchema: object<{ expression: string }>({ expression: { type: "string", description: "e.g. (100+200)/2" } }, ["expression"]),
  async execute({ expression }) {
    console.log(`    · calculate("${expression}")`);
    if (!/^[\d\s+\-*/().]+$/.test(expression)) return "Refused: expression contains illegal characters.";
    try {
      const result = Function(`"use strict"; return (${expression});`)() as number;
      return `${expression} = ${result}`;
    } catch {
      return `Could not evaluate "${expression}".`;
    }
  },
});

const convertCurrency = tool({
  name: "convert_currency",
  description: "Convert an amount from one currency to another (supports USD→JPY, USD→EUR, USD→GBP).",
  inputSchema: object<{ amount: number; from: string; to: string }>(
    { amount: { type: "number" }, from: { type: "string", description: "ISO code, e.g. USD" }, to: { type: "string", description: "ISO code, e.g. JPY" } },
    ["amount", "from", "to"],
  ),
  async execute({ amount, from, to }) {
    console.log(`    · convert_currency(${amount}, ${from}→${to})`);
    const rate = FX[`${from}_${to}`];
    if (rate === undefined) return `No FX rate for ${from}→${to}.`;
    return `${amount} ${from} = ${(amount * rate).toFixed(2)} ${to} (rate ${rate}).`;
  },
});

const average = tool({
  name: "average",
  description: "Compute the arithmetic mean of a comma-separated list of numbers.",
  inputSchema: object<{ numbers: string }>({ numbers: { type: "string", description: "e.g. 100,200,300" } }, ["numbers"]),
  async execute({ numbers }) {
    console.log(`    · average("${numbers}")`);
    const xs = numbers.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
    if (xs.length === 0) return "No valid numbers provided.";
    return `average(${xs.join(", ")}) = ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)}`;
  },
});

const analyst = agent({
  model,
  instructions:
    "You are a numerical analyst with calculation tools. You MUST use the tools for every number — never compute in your head. " +
    "Use convert_currency for any currency conversion, average for means, and calculate for arithmetic. " +
    "Report the exact tool outputs.",
  tools: [calculate, convertCurrency, average],
});

// ── agent 3: lead / orchestrator (2 own tools + 2 sub-agents) ───────────────────────────────────
interface LeadDeps {
  readonly notes: string[];
}

const getCurrentTime = tool({
  name: "get_current_time",
  description: "Get the current UTC date and time.",
  inputSchema: object<Record<string, never>>({}, []),
  async execute() {
    console.log("    · get_current_time()");
    // Fixed clock so the run is deterministic.
    return "2026-07-23T18:53:00Z (UTC)";
  },
});

// Deps-backed tools use the `tool<Deps>()` factory form so `ctx.deps` is typed.
const leadTool = tool<LeadDeps>();

const saveNote = leadTool({
  name: "save_note",
  description: "Persist a titled note to the trip planner's note store.",
  inputSchema: object<{ title: string; body: string }>({ title: { type: "string" }, body: { type: "string" } }, ["title", "body"]),
  async execute({ title, body }, ctx) {
    console.log(`    · save_note("${title}")`);
    ctx.deps.notes.push(`# ${title}\n${body}`);
    return `Saved note "${title}" (store now holds ${ctx.deps.notes.length} note(s)).`;
  },
});

const lead = agent<LeadDeps>()({
  model,
  instructions:
    "You are a trip-planning orchestrator. You never answer facts or do math yourself.\n" +
    "ROUTING RULES (follow exactly):\n" +
    "• Weather, timezone, or non-numeric facts → call `research` ONCE with the full question.\n" +
    "• ANY number work — currency conversion, exchange rates, averages, arithmetic, budgets → call `analyze` ONCE with the full question. NEVER send number/currency questions to `research`.\n" +
    "• A question about the current time → call get_current_time.\n" +
    "• A request to save/summarize → call save_note.\n" +
    "Trust the tool outputs and report them. Keep replies short.",
  tools: [
    getCurrentTime,
    saveNote,
    asTool(researcher, { name: "research", description: "Look up NON-numeric facts only: weather, timezone, general knowledge. Never use for math or currency." }),
    asTool(analyst, { name: "analyze", description: "Do ALL number work here: currency conversion, exchange rates, averages, and arithmetic. Pass the full numeric question." }),
  ],
});

// ── driver: 3 conversation turns, threading history ─────────────────────────────────────────────
const notes: string[] = [];
const history: InputMessage[] = [];

const userTurns = [
  "What's the current UTC time right now? Also, for my Tokyo trip: what's the weather there, its timezone, and roughly Tokyo's population?",
  "My budget is 2000 USD. How many JPY is that, what's the average of daily spends 150, 220, and 305, and what is 314400 divided by 30?",
  "Great. Save a short note titled 'Tokyo Trip' summarizing everything we've discussed.",
];

async function runTurn(index: number, userMessage: string): Promise<void> {
  console.log(`\n\x1b[1m━━ Turn ${index + 1} ━━\x1b[0m`);
  console.log(`\x1b[36muser:\x1b[0m ${userMessage}`);
  history.push({ role: "user", content: userMessage });

  const handle = lead.stream(history, { deps: { notes }, transport, maxSteps: 12 });

  let text = "";
  process.stdout.write("\x1b[32massistant:\x1b[0m ");
  for await (const ev of handle) {
    switch (ev.type) {
      case "text.delta":
        text += ev.delta ?? "";
        process.stdout.write(ev.delta ?? "");
        break;
      case "tool.call":
        console.log(`\n  \x1b[33m→ ${ev.name}(${JSON.stringify(ev.input)})\x1b[0m`);
        break;
      case "run.error":
        console.error("\n  \x1b[31m[run.error]\x1b[0m", ev.error);
        break;
      default:
        break;
    }
  }

  const result = await handle.result();
  console.log(`\n  \x1b[90m[status: ${result.status}${result.status === "completed" ? `, steps: ${result.usage.steps}, tokens: ${result.usage.input}/${result.usage.output}` : ""}]\x1b[0m`);
  if (result.status === "completed") history.push({ role: "assistant", content: result.output });
}

console.log("╭──────────────────────────────────────────────────────────────╮");
console.log("│  Mithril complex harness test — 3 agents · 8 tools · 3 turns  │");
console.log("│  model: openai/gpt-oss-20b via OpenRouter                     │");
console.log("╰──────────────────────────────────────────────────────────────╯");

for (let i = 0; i < userTurns.length; i++) {
  await runTurn(i, userTurns[i]!);
}

console.log("\n\x1b[1m━━ Final note store ━━\x1b[0m");
console.log(notes.length ? notes.map((n) => n.split("\n").map((l) => "  " + l).join("\n")).join("\n  ---\n") : "  (empty)");
console.log(`\n\x1b[1m✓ Completed ${userTurns.length} turns with ${history.filter((m) => m.role === "assistant").length} assistant replies.\x1b[0m`);
