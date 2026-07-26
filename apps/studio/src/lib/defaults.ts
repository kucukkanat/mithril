import { SPEC_VERSION, type ProjectSpec } from "@mithril/spec";
import type { ComponentType } from "react";
import {
  ApprovalGlyph,
  ChatGlyph,
  ExtractGlyph,
  FrontierGlyph,
  HandoffGlyph,
  ToolGlyph,
} from "../components/icons.tsx";

/*
 * Starter templates for the first-run gallery. Each is a REAL, runnable ProjectSpec — all but the
 * frontier one on a small on-device model, so a newcomer gets a streaming run with zero keys and zero
 * setup.
 *
 * Each also arrives with SEED CASES: the examples it must handle. They are deliberately shipped
 * UNCHECKED (`baseline: null`, `last: null`) rather than pre-marked red. The gallery copy promises
 * examples that are already failing, and several genuinely will — but a hard-coded verdict would be a
 * claim about a run that never happened, and the first "Re-check all" would expose it. So the cards
 * show which cases are *expected* to be interesting via `expectFail`, presentation only, while the
 * casebook itself stays honest: unreviewed until the runtime says otherwise.
 */

const LOCAL = { kind: "local" as const, model: "onnx-community/Qwen3-0.6B-ONNX" };

/** A seed case shipped with a template. */
export interface SeedCase {
  readonly text: string;
  /** Presentational only — whether the card dots this case as one the untuned agent likely fumbles. */
  readonly expectFail: boolean;
}

export interface ProjectTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly glyph: ComponentType;
  readonly tags: readonly string[];
  /** True when running needs a BYOK key (surfaced on the card so "no key" templates are obvious). */
  readonly needsKey?: boolean;
  /** One template leads the grid and shows the spec⇄code trade on the first screen. */
  readonly featured?: boolean;
  /** The generated-code excerpt shown on the featured card. */
  readonly peek?: string;
  readonly cases: readonly SeedCase[];
  readonly spec: ProjectSpec;
}

const toolAgent: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Weather & sources",
  decls: [
    {
      kind: "tool",
      id: "get_current_weather",
      name: "get_current_weather",
      // Deliberately under-specified: it says WHAT it is and never WHEN to call it, which is exactly
      // why the first two cases fail and what the tool lint flags. Fixing it is the tutorial.
      description: "Current conditions for a city",
      inputSchema: { zod: `z.object({ city: z.string() })` },
      execute: {
        code: `async ({ city }) => {\n  // TODO: call your real weather API here. Returns a fixture until you do.\n  const FIXTURE = { istanbul: { tempC: 21, conditions: "clear" } };\n  const hit = FIXTURE[city.trim().toLowerCase()];\n  return hit === undefined ? { found: false, city } : { found: true, city, ...hit };\n}`,
      },
    },
    {
      kind: "agent",
      id: "assistant",
      model: LOCAL,
      instructions: "Answer questions about current weather, and cite a source when asked.",
      tools: ["get_current_weather"],
    },
  ],
  entry: { target: "assistant", input: "" },
};

const chatbot: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Plain chatbot",
  decls: [{ kind: "agent", id: "assistant", model: LOCAL, instructions: "Be a friendly assistant that answers briefly.", tools: [] }],
  entry: { target: "assistant", input: "" },
};

const extractor: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Structured extractor",
  decls: [
    {
      kind: "agent",
      id: "extractor",
      model: LOCAL,
      instructions: "Pull the invoice number, date and total out of pasted text. Reply with ONLY a JSON object matching the schema.",
      tools: [],
      output: { zod: `z.object({ invoiceNumber: z.string(), date: z.string(), total: z.number() })` },
    },
  ],
  entry: { target: "extractor", input: "" },
};

const approval: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Approval agent",
  decls: [
    {
      kind: "tool",
      id: "send_reply",
      name: "send_reply",
      description: "Use this to send a drafted reply, but only after the user has approved it.",
      inputSchema: { zod: `z.object({ to: z.string().describe("e.g. ada@analytical.co"), body: z.string().describe("The reply text to send") })` },
      needsApproval: true,
      execute: { code: `async ({ to, body }) => ({ sent: true, to, chars: body.length })` },
    },
    {
      kind: "agent",
      id: "assistant",
      model: LOCAL,
      instructions: "Draft and send replies, but never send without asking me first.",
      tools: ["send_reply"],
    },
  ],
  entry: { target: "assistant", input: "" },
};

const handoff: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Multi-agent handoff",
  decls: [
    {
      kind: "tool",
      id: "lookup_account",
      name: "lookup_account",
      description: "Use this whenever a billing question needs the customer's account record.",
      inputSchema: { zod: `z.object({ email: z.string().describe("e.g. ada@analytical.co") })` },
      execute: {
        code: `async ({ email }) => {\n  // TODO: call your real billing API here. Returns a fixture until you do.\n  const FIXTURE = { "ada@analytical.co": { plan: "pro", lastCharge: "2026-07-01", amount: 49 } };\n  const hit = FIXTURE[email.trim().toLowerCase()];\n  return hit === undefined ? { found: false, email } : { found: true, email, ...hit };\n}`,
      },
    },
    {
      kind: "agent",
      id: "billing",
      model: LOCAL,
      instructions: "You handle billing questions. Look up the account before answering about charges.",
      tools: ["lookup_account"],
    },
    {
      kind: "subAgentTool",
      id: "ask_billing",
      agentId: "billing",
      name: "ask_billing",
      description: "Use this when the user asks about charges, invoices, refunds or their plan.",
    },
    {
      kind: "agent",
      id: "assistant",
      model: LOCAL,
      instructions: "Route billing questions and refund requests to the right specialist. Answer everything else yourself.",
      tools: ["ask_billing"],
    },
  ],
  entry: { target: "assistant", input: "" },
};

const frontier: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "Frontier model",
  decls: [
    {
      kind: "agent",
      id: "assistant",
      model: { kind: "live", provider: "anthropic", model: "claude-sonnet-4-5" },
      instructions: "Answer hard reasoning questions with sources. Say when you are unsure.",
      tools: [],
    },
  ],
  entry: { target: "assistant", input: "" },
};

export const TEMPLATES: readonly ProjectTemplate[] = [
  {
    id: "tool-agent",
    name: "Tool-using agent",
    description: "Calls a tool to answer. The shortest path to your first red case going green.",
    glyph: ToolGlyph,
    tags: ["local", "tools", "3 cases"],
    featured: true,
    peek: `export const assistant = agent({
  instructions: [
    "Answer in one or two sentences.",
    "Use the weather tool for right now.",
  ].join("\\n"),
  tools: { get_current_weather },
});`,
    cases: [
      { text: "What's the weather in Istanbul?", expectFail: true },
      { text: "Is it raining in Oslo right now?", expectFail: true },
      { text: "How hot will it be tomorrow?", expectFail: false },
    ],
    spec: toolAgent,
  },
  {
    id: "chatbot",
    name: "Plain chatbot",
    description: "A job line and nothing else — no tools to attach.",
    glyph: ChatGlyph,
    tags: ["local", "beginner"],
    cases: [
      { text: "hi", expectFail: false },
      { text: "write me an essay", expectFail: true },
    ],
    spec: chatbot,
  },
  {
    id: "extractor",
    name: "Structured extractor",
    description: "Returns a typed object, validated against a schema you edit as fields.",
    glyph: ExtractGlyph,
    tags: ["local", "structured"],
    cases: [
      { text: "Invoice #INV-2291, due 3 Mar, £412.50", expectFail: false },
      { text: "no invoice here", expectFail: true },
    ],
    spec: extractor,
  },
  {
    id: "approval",
    name: "Approval agent",
    description: "A tool gated behind your approval — the run pauses for you.",
    glyph: ApprovalGlyph,
    tags: ["local", "human-in-the-loop"],
    cases: [
      { text: "reply that we can meet Thursday", expectFail: false },
      { text: "send it now", expectFail: true },
    ],
    spec: approval,
  },
  {
    id: "handoff",
    name: "Multi-agent handoff",
    description: "A router that delegates to specialists.",
    glyph: HandoffGlyph,
    tags: ["local", "multi-agent"],
    cases: [
      { text: "I was charged twice", expectFail: false },
      { text: "cancel and refund me", expectFail: true },
    ],
    spec: handoff,
  },
  {
    id: "frontier",
    name: "Frontier model",
    description: "Run against Anthropic with your own key. Nothing is stored.",
    glyph: FrontierGlyph,
    tags: ["cloud"],
    needsKey: true,
    cases: [{ text: "compare these two contracts", expectFail: false }],
    spec: frontier,
  },
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
  return { ...template.spec, name: uniqueName(template.spec.name, existingNames) };
}

/** `base`, or `base 2` / `base 3` … until it doesn't collide with an existing name. */
export function uniqueName(base: string, existing: ReadonlySet<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
