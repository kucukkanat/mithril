/*
 * Playground examples. Each is provider-agnostic: `bodyImports` + `scriptedTurns` + `body`, where
 * `body` references a `model` that `assembleExample` (providers.ts) slots in for the chosen ⚙ target —
 * the scripted test double by default, or a real remote/local provider. Picking a provider re-assembles
 * the SAME example against it, so there's no separate "live" or "local" example to maintain.
 *
 * Two bindings come from the playground harness itself:
 *   • run(agent, input)  — streams the agent and pipes its MithrilEvent stream into the inspector.
 *   • usage              — a default UsageDelta, so scripted model turns stay terse.
 */

import type { ExampleParts } from "./providers.ts";

export interface Preset {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly parts: ExampleParts;
}

const IMP_TOOLS = `import { agent, tool } from "mithril";
import { z } from "zod";`;
const IMP_AGENT_Z = `import { agent } from "mithril";
import { z } from "zod";`;
const IMP_AGENT = `import { agent } from "mithril";`;

const toolCall: ExampleParts = {
  bodyImports: IMP_TOOLS,
  scriptedTurns: `[
  [
    { type: "tool.call", callId: "c1", name: "weather", input: { city: "Istanbul" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "It's 21°C " },
    { type: "text.delta", delta: "and clear in Istanbul." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 21 }),
});

const assistant = agent({
  model,
  instructions: "You are a concise weather assistant.",
  tools: [weather],
});

await run(assistant, "What's the weather in Istanbul?");`,
};

const multiTool: ExampleParts = {
  bodyImports: IMP_TOOLS,
  scriptedTurns: `[
  [
    { type: "tool.call", callId: "c1", name: "searchFlights", input: { from: "London", to: "Istanbul" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "tool.call", callId: "c2", name: "getWeather", input: { city: "Istanbul" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "tool.call", callId: "c3", name: "findHotels", input: { city: "Istanbul", nights: 2 } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "tool.call", callId: "c4", name: "convertCurrency", input: { amount: 420, from: "GBP", to: "TRY" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "Weekend in Istanbul: fly BA117 (£240), " },
    { type: "text.delta", delta: "2 nights at Sirkeci Mansion (£180 ≈ ₺16,800), sunny at 19°C." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// A trip planner with SIX tools. Offline, the scripted turns above drive the sequence; against a real
// model the loop lets IT choose which tools to call and in what order. Watch the Events tab.
const searchFlights = tool({
  name: "searchFlights",
  description: "Find a flight between two cities.",
  inputSchema: z.object({ from: z.string(), to: z.string() }),
  execute: async ({ from, to }) => ({ flight: "BA117", from, to, priceGBP: 240 }),
});
const getWeather = tool({
  name: "getWeather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 19, sky: "sunny" }),
});
const findHotels = tool({
  name: "findHotels",
  description: "Find hotels in a city for a number of nights.",
  inputSchema: z.object({ city: z.string(), nights: z.number() }),
  execute: async ({ city, nights }) => ({ hotel: "Sirkeci Mansion", city, nights, totalGBP: 180 }),
});
const convertCurrency = tool({
  name: "convertCurrency",
  description: "Convert an amount between two currencies.",
  inputSchema: z.object({ amount: z.number(), from: z.string(), to: z.string() }),
  execute: async ({ amount, from, to }) => ({ amount, from, to, result: Math.round(amount * 40) }),
});
const getLocalTime = tool({
  name: "getLocalTime",
  description: "Current local time in a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, time: "14:30" }),
});
const translate = tool({
  name: "translate",
  description: "Translate text into a language.",
  inputSchema: z.object({ text: z.string(), to: z.string() }),
  execute: async ({ text, to }) => ({ text, to, translated: "Merhaba!" }),
});

const planner = agent({
  model,
  instructions: "You are a trip planner. Use the tools to gather flights, weather, hotels, and costs, then give a short summary.",
  tools: [searchFlights, getWeather, findHotels, convertCurrency, getLocalTime, translate],
});

await run(planner, "Plan a 2-night weekend in Istanbul, flying from London.");`,
};

const streaming: ExampleParts = {
  bodyImports: IMP_AGENT,
  scriptedTurns: `[
  [
    { type: "text.delta", delta: "Mithril streams " },
    { type: "text.delta", delta: "the model's tokens as " },
    { type: "text.delta", delta: "typed text.delta events — " },
    { type: "text.delta", delta: "one canonical source, three tiers." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// No tools — just streamed text. Watch the text.delta events accumulate in the Output pane
// while the event log records each chunk.
const assistant = agent({ model, instructions: "Be concise." });

await run(assistant, "Explain streaming in one sentence.");`,
};

const chatHistory: ExampleParts = {
  bodyImports: IMP_AGENT,
  scriptedTurns: `[
  [
    { type: "text.delta", delta: "France has about 68 million people." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// Input is a string OR an array of prior turns. Pass history to continue a conversation.
// Open the State tab after running to see the whole transcript seeded from history.
const assistant = agent({ model, instructions: "You are a concise geography assistant." });

const history = [
  { role: "user", content: "What's the capital of France?" },
  { role: "assistant", content: "Paris." },
  { role: "user", content: "And its population?" },
] as const;

await run(assistant, history);`,
};

const structured: ExampleParts = {
  bodyImports: IMP_AGENT_Z,
  scriptedTurns: `[
  [
    { type: "text.delta", delta: '{"city":"Istanbul",' },
    { type: "text.delta", delta: ' "tempC":21, "condition":"clear"}' },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// With an output schema, the loop parses the model's JSON, validates it, and emits object.delta
// (streaming) then object.final (typed). Invalid JSON retries.
const assistant = agent({
  model,
  instructions: "Extract the weather as JSON.",
  output: z.object({
    city: z.string(),
    tempC: z.number(),
    condition: z.string(),
  }),
});

const result = await run(assistant, "It's 21°C and clear in Istanbul.");
if (result.status === "completed") console.log("typed output:", result.output);`,
};

const middleware: ExampleParts = {
  bodyImports: IMP_TOOLS,
  scriptedTurns: `[
  [
    { type: "tool.call", callId: "c1", name: "search", input: { q: "mithril" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "Found 3 results." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// Middleware observes/transforms ONLY by emitting events — no private side channel. This one emits
// a custom.audit event around every tool call, so it shows up right in the inspector.
const audit = {
  name: "audit",
  tool: async (ctx, call, next) => {
    ctx.emit({ type: "custom.audit", payload: { tool: call.name, input: call.input } });
    return next(call);
  },
};

const search = tool({
  name: "search",
  description: "Search the docs.",
  inputSchema: z.object({ q: z.string() }),
  execute: async ({ q }) => ({ hits: 3, q }),
});

const assistant = agent({
  model,
  instructions: "Use the search tool.",
  tools: [search],
  use: [audit],
});

await run(assistant, "Search for mithril.");`,
};

const hitl: ExampleParts = {
  bodyImports: IMP_TOOLS,
  scriptedTurns: `[
  [
    { type: "tool.call", callId: "c1", name: "deploy", input: { env: "production" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "Deployed to production. ✅" },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`,
  body: `// needsApproval pauses the run BEFORE the tool executes and returns a typed, serializable suspension.
// The playground surfaces Approve / Reject — approving resumes from the durable-local suspension token.
const deploy = tool({
  name: "deploy",
  description: "Deploy the app to an environment.",
  inputSchema: z.object({ env: z.string() }),
  needsApproval: true,
  execute: async ({ env }) => ({ deployed: true, env }),
});

const assistant = agent({
  model,
  instructions: "Deploy when asked.",
  tools: [deploy],
});

await run(assistant, "Deploy to production.");`,
};

export const PRESETS: readonly Preset[] = [
  { id: "tool-call", label: "Tool call", blurb: "Model calls a tool, then answers.", parts: toolCall },
  { id: "multi-tool", label: "Multi-tool", blurb: "Six tools, several calls in sequence.", parts: multiTool },
  { id: "streaming", label: "Streaming text", blurb: "Watch text.delta events stream.", parts: streaming },
  { id: "chat-history", label: "Chat history", blurb: "Continue a conversation from prior turns.", parts: chatHistory },
  { id: "structured", label: "Structured output", blurb: "Typed JSON via an output schema.", parts: structured },
  { id: "middleware", label: "Middleware", blurb: "Emit a custom event around a tool.", parts: middleware },
  { id: "hitl", label: "Human-in-the-loop", blurb: "Approve before a tool runs.", parts: hitl },
];

export const DEFAULT_PRESET = PRESETS[0]!;
