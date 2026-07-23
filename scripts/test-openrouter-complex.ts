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
import type { StandardSchemaV1, InputMessage, JsonSchema, ModelHandle } from "mithril";
import { transformers } from "mithril/transformers";
// ── OpenAI / OpenRouter path (commented out — running local on-device models instead) ─────────────
// import { openaiProvider } from "mithril/openai";
//
// const apiKey = process.env["OPENROUTER_API_KEY"];
// if (!apiKey) throw new Error("OPENROUTER_API_KEY not set (export it or use bun --env-file=.env)");
//
// // OpenRouter is OpenAI-wire-compatible. The OpenAI provider slices the model id after the first "/",
// // so an "openai/" handle prefix + the real OpenRouter id "openai/gpt-oss-20b" sends "openai/gpt-oss-20b".
// const provider = openaiProvider({ baseUrl: "https://openrouter.ai/api/v1" });
// const model = { id: "openai/openai/gpt-oss-20b", provider };
// const transport = { kind: "byok", apiKey } as const;

// ── config: local on-device models (Qwen < 2B + LFM), run via Transformers.js on CPU ──────────────
const transport = undefined;
const TARGET_MODELS: readonly { id: string; label: string; dtype?: string }[] = [
  { id: "onnx-community/Qwen3-0.6B-ONNX", label: "Qwen3 0.6B" },
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B" },
  { id: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX", label: "LFM2.5 1.2B" },
  { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Qwen2.5 1.5B" },
  { id: "onnx-community/Qwen3-1.7B-ONNX", label: "Qwen3 1.7B" },
];

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
    fired("web_search");
    console.log(`    · web_search("${query}")`);
    return `Top result for "${query}": Tokyo is the capital of Japan; population ~14 million.`;
  },
});

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: object<{ city: string }>({ city: { type: "string", description: "city name" } }, ["city"]),
  async execute({ city }) {
    fired("get_weather");
    console.log(`    · get_weather("${city}")`);
    return WEATHER[city] ?? `No weather data for ${city}.`;
  },
});

const lookupTimezone = tool({
  name: "lookup_timezone",
  description: "Look up the timezone of a city.",
  inputSchema: object<{ city: string }>({ city: { type: "string", description: "city name" } }, ["city"]),
  async execute({ city }) {
    fired("lookup_timezone");
    console.log(`    · lookup_timezone("${city}")`);
    return TZ[city] ?? `No timezone data for ${city}.`;
  },
});

const makeResearcher = (model: ModelHandle) => agent({
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
    fired("calculate");
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
    fired("convert_currency");
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
    fired("average");
    console.log(`    · average("${numbers}")`);
    const xs = numbers.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
    if (xs.length === 0) return "No valid numbers provided.";
    return `average(${xs.join(", ")}) = ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)}`;
  },
});

const makeAnalyst = (model: ModelHandle) => agent({
  model,
  instructions:
    "You are a numerical analyst. You have NO innate knowledge of exchange rates or arithmetic and WILL be wrong if you answer from memory.\n" +
    "MANDATORY: for a currency/JPY/exchange question call convert_currency; for a mean/average call average; for any other arithmetic (division, multiplication, etc.) call calculate.\n" +
    "If the user asks several things, call ALL the relevant tools (one per sub-question) BEFORE writing any answer. Then report only the tool outputs.",
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
    fired("get_current_time");
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
    fired("save_note");
    console.log(`    · save_note("${title}")`);
    ctx.deps.notes.push(`# ${title}\n${body}`);
    return `Saved note "${title}" (store now holds ${ctx.deps.notes.length} note(s)).`;
  },
});

const makeLead = (model: ModelHandle) => {
  const researcher = makeResearcher(model);
  const analyst = makeAnalyst(model);
  return agent<LeadDeps>()({
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
};

// ── driver: 3 conversation turns, threading history ─────────────────────────────────────────────
const userTurns = [
  "What's the current UTC time right now? Also, for my Tokyo trip: what's the weather there, its timezone, and roughly Tokyo's population?",
  "My budget is 2000 USD. How many JPY is that, what's the average of daily spends 150, 220, and 305, and what is 314400 divided by 30?",
  "Great. Save a short note titled 'Tokyo Trip' summarizing everything we've discussed.",
];

async function runTurn(
  lead: ReturnType<typeof makeLead>,
  history: InputMessage[],
  notes: string[],
  index: number,
  userMessage: string,
): Promise<void> {
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

const pad = (s: string, n: number): string => (s.length >= n ? s : s + " ".repeat(n - s.length));

async function runScenario(target: { id: string; label: string; dtype?: string }): Promise<void> {
  toolsFired.clear();
  const bar = "━".repeat(62);
  console.log(`\n╭${"─".repeat(64)}╮`);
  console.log(`│  ${pad(`Local model: ${target.label}  (${target.id})`, 60)} │`);
  console.log(`╰${"─".repeat(64)}╯`);

  const model = transformers(target.id, { device: "cpu", ...(target.dtype ? { dtype: target.dtype } : {}) });
  const lead = makeLead(model);

  const notes: string[] = [];
  const history: InputMessage[] = [];

  for (let i = 0; i < userTurns.length; i++) {
    await runTurn(lead, history, notes, i, userTurns[i]!);
  }

  console.log("\n\x1b[1m━━ Final note store ━━\x1b[0m");
  console.log(notes.length ? notes.map((n) => n.split("\n").map((l) => "  " + l).join("\n")).join("\n  ---\n") : "  (empty)");
  console.log(`\n\x1b[1m✓ ${target.label}: completed ${userTurns.length} turns with ${history.filter((m) => m.role === "assistant").length} assistant replies.\x1b[0m`);

  console.log("\n\x1b[1m━━ Tool coverage ━━\x1b[0m");
  for (const name of ALL_TOOLS) {
    console.log(`  ${toolsFired.has(name) ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${name}`);
  }
  const missing = ALL_TOOLS.filter((t) => !toolsFired.has(t));
  console.log(missing.length === 0 ? "\x1b[32m\nAll 8 tools were exercised.\x1b[0m" : `\x1b[33m\n${8 - missing.length}/8 tools fired (not triggered this run: ${missing.join(", ")}).\x1b[0m`);
  console.log(`\x1b[90m${bar}\x1b[0m`);
}

console.log("╭──────────────────────────────────────────────────────────────╮");
console.log("│  Mithril complex harness test — 3 agents · 8 tools · 3 turns  │");
console.log("│  local on-device models (Qwen < 2B + LFM) via Transformers.js │");
console.log("╰──────────────────────────────────────────────────────────────╯");

for (const target of TARGET_MODELS) {
  try {
    await runScenario(target);
  } catch (err) {
    console.error(`\n\x1b[31m✗ ${target.label} (${target.id}) failed:\x1b[0m`, err instanceof Error ? err.message : err);
  }
}
