import { SPEC_VERSION, type ProjectSpec } from "@mithril/spec";

/*
 * Starter templates for the first-run gallery. Each is a REAL, runnable ProjectSpec — most on a small
 * on-device model so a newcomer gets a streaming run with zero keys and zero setup. `blankProject` backs
 * the quiet "Start blank" escape hatch.
 */

const LOCAL = { kind: "local" as const, model: "onnx-community/Qwen3-0.6B-ONNX" };

export interface ProjectTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** A single emoji glyph shown on the card. */
  readonly icon: string;
  readonly tags: readonly string[];
  /** True when running needs a BYOK key (surfaced on the card so "no key" templates are obvious). */
  readonly needsKey?: boolean;
  readonly spec: ProjectSpec;
}

const chatbot: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Chatbot",
  decls: [{ kind: "agent", id: "assistant", model: LOCAL, instructions: "You are a helpful, concise assistant.", tools: [] }],
  entry: { target: "assistant", input: "Tell me a fun fact about the metal mithril." },
};

const toolAgent: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Tool-using agent",
  decls: [
    { kind: "tool", id: "weather", name: "weather", description: "Current weather for a city.", inputSchema: { zod: `z.object({ city: z.string() })` }, execute: { code: `async ({ city }) => ({ city, tempC: 21 })` } },
    { kind: "agent", id: "assistant", model: LOCAL, instructions: "You are a concise weather assistant. Use the weather tool when asked about weather.", tools: ["weather"] },
  ],
  entry: { target: "assistant", input: "What's the weather in Istanbul?" },
};

const extractor: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Structured extractor",
  decls: [
    {
      kind: "agent",
      id: "extractor",
      model: LOCAL,
      instructions: "Extract the person's contact details from the message. Reply with ONLY a JSON object matching the schema.",
      tools: [],
      output: { zod: `z.object({ name: z.string(), email: z.string(), company: z.string() })` },
    },
  ],
  entry: { target: "extractor", input: "Please reach out to Ada Lovelace (ada@analytical.co) over at Analytical Engines Ltd." },
};

const approval: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Approval agent",
  decls: [
    {
      kind: "tool",
      id: "sendEmail",
      name: "send_email",
      description: "Send an email to a recipient.",
      inputSchema: { zod: `z.object({ to: z.string(), body: z.string() })` },
      needsApproval: true,
      execute: { code: `async ({ to, body }) => ({ sent: true, to, chars: body.length })` },
    },
    { kind: "agent", id: "assistant", model: LOCAL, instructions: "Use send_email to contact people when the user asks. Keep messages short.", tools: ["sendEmail"] },
  ],
  entry: { target: "assistant", input: "Email ada@analytical.co to say hello." },
};

const researcher: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Multi-tool researcher",
  decls: [
    { kind: "tool", id: "search", name: "search", description: "Search the web for a query (demo: returns a canned result).", inputSchema: { zod: `z.object({ query: z.string() })` }, execute: { code: `async ({ query }) => ({ results: ["Istanbul has a population of about 15.5 million."], query })` } },
    { kind: "tool", id: "calculator", name: "calculator", description: "Do arithmetic on two numbers.", inputSchema: { zod: `z.object({ a: z.number(), b: z.number(), op: z.enum(["+", "-", "*", "/"]) })` }, execute: { code: `async ({ a, b, op }) => ({ result: op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b })` } },
    { kind: "agent", id: "assistant", model: LOCAL, instructions: "Use the search and calculator tools to research and compute. Show your reasoning briefly.", tools: ["search", "calculator"] },
  ],
  entry: { target: "assistant", input: "Search for the population of Istanbul, then compute 10% of it." },
};

const cloud: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Cloud model (BYOK)",
  decls: [{ kind: "agent", id: "assistant", model: { kind: "live", provider: "openai", model: "gpt-4o-mini" }, instructions: "You are a concise, helpful assistant.", tools: [] }],
  entry: { target: "assistant", input: "Explain what an AI agent is in one sentence." },
};

export const TEMPLATES: readonly ProjectTemplate[] = [
  { id: "chatbot", name: "Chatbot", description: "A plain conversational agent — just a system prompt, no tools.", icon: "💬", tags: ["local", "beginner"], spec: chatbot },
  { id: "tool-agent", name: "Tool-using agent", description: "Calls a tool to answer — the classic tool-calling loop.", icon: "🛠", tags: ["local", "tools"], spec: toolAgent },
  { id: "extractor", name: "Structured extractor", description: "Returns a typed object, validated against a zod schema.", icon: "🧬", tags: ["local", "structured output"], spec: extractor },
  { id: "approval", name: "Approval agent (HITL)", description: "A tool gated behind human approval — the run pauses for you.", icon: "🔒", tags: ["local", "human-in-the-loop"], spec: approval },
  { id: "researcher", name: "Multi-tool researcher", description: "Two tools — search + calculator — for multi-step tasks.", icon: "🔎", tags: ["local", "tools"], spec: researcher },
  { id: "cloud", name: "Cloud model (BYOK)", description: "A chatbot on a hosted model. Bring your own API key.", icon: "☁️", tags: ["cloud"], needsKey: true, spec: cloud },
];

/** The quiet "Start blank" escape hatch — a minimal local chatbot. */
export function blankProject(name: string): ProjectSpec {
  return {
    specVersion: SPEC_VERSION,
    name,
    decls: [{ kind: "agent", id: "assistant", model: LOCAL, instructions: "You are a helpful assistant.", tools: [] }],
    entry: { target: "assistant", input: "" },
  };
}

/** A template's spec, renamed and deduplicated against existing project names. */
export function templateSpec(template: ProjectTemplate, existingNames: ReadonlySet<string>): ProjectSpec {
  return { ...template.spec, name: uniqueName(template.name, existingNames) };
}

/** `base`, or `base 2` / `base 3` … until it doesn't collide with an existing name. */
export function uniqueName(base: string, existing: ReadonlySet<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
