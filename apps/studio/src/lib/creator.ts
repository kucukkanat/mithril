/*
 * The agent that creates agents.
 *
 * Like drafting, a build IS a Mithril run — but a TOOL-CALLING one. The creator is an ordinary
 * `agent({ tools: [...] })` whose tools are meta-tools: `create_tool`, `create_agent`,
 * `create_subagent`, `attach_tool`, `remove_decl`, `finish`. It runs in the same sandboxed worker as
 * every other Studio run, so it inherits on-device models, BYOK handling and the event stream free.
 *
 * The meta-tools emit DATA, never framework code — the principle `@mithril/authoring` already
 * states: "A definition is ordinary data, so the model never writes framework code." That is also
 * forced by the runner's module registry, which deliberately does not expose `@mithril/spec`: the
 * worker literally cannot build a ProjectSpec, so the host does it from the emitted payloads.
 *
 * Progress rides the injected `emit()` global rather than the `tool.call` event stream, for two
 * reasons: `emit` fires from INSIDE the tool body, i.e. only after our own validation accepted the
 * call (a rejected duplicate never reaches the host), and `RunnerSnapshot.data` accumulates payloads
 * and SURVIVES the run failing — which is what makes a partial build salvageable.
 *
 * Everything here is pure. Executing it is the store's job.
 */
import {
  GROQ_PROVIDER_DECL,
  SPEC_VERSION,
  modelExpr,
  providerImportEntries,
  providerOf,
  type AgentSpec,
  type ModelSpec,
  type ProjectDecl,
  type ProjectSpec,
  type SubAgentToolSpec,
  type ToolSpec,
} from "@mithril/spec";
import { inputsToZod, safeIdent, type DraftInput } from "./drafting.ts";
import { stubBody } from "./tool-fields.ts";
import { orderDecls } from "./order.ts";

/** Build a whole project from one prompt. */
export interface CreateRequest {
  readonly kind: "create";
  /** What the user typed: the agent they want. */
  readonly job: string;
}

/** Change an existing project by instruction, from the Designer's bar. */
export interface EditRequest {
  readonly kind: "edit";
  readonly instruction: string;
  /** The project as it stands, summarized — see {@link specSummary}. */
  readonly summary: string;
}

export type CreatorRequest = CreateRequest | EditRequest;

/**
 * Identifiers a generated decl may never take.
 *
 * A tool called `groq` collides with the provider const codegen emits, redeclaring it — and the
 * project cannot even be opened. `orderDecls` cannot save that: it tracks decls by identity
 * precisely so a duplicate id can't make one vanish, but codegen still emits both statements.
 * The rest are the runner's injected globals and every name codegen plans as an import.
 */
export const RESERVED_IDS: ReadonlySet<string> = new Set([
  "run",
  "emit",
  "usage",
  "console",
  "process",
  "globalThis",
  "agent",
  "tool",
  "asTool",
  "z",
  "openai",
  "openaiProvider",
  "anthropic",
  "google",
  "groq",
  "transformers",
  "defineWorkflow",
  "goto",
  "done",
]);

/** How many steps a build may take before the loop stops it. */
const MAX_STEPS = 24;

const INPUTS_ZOD = `z.array(z.object({
      name: z.string(),
      type: z.enum(["text", "number", "boolean"]),
      description: z.string(),
    }))`;

/*
 * Six flat schemas. Nesting is where small models fall over, so the only array-of-objects is the one
 * that cannot be avoided (a tool's inputs). Every tool carries `examples`, which the loop folds into
 * the wire description on every provider — free few-shot with no per-provider work, exactly what
 * @mithril/authoring's define_tool does.
 */
const META_TOOLS: readonly {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: string;
  readonly examples: string;
  /** Body of the `execute` arrow, after validation. Receives `input`. */
  readonly emit: string;
  readonly ack: string;
}[] = [
  {
    name: "create_tool",
    description:
      "Create ONE tool an agent can call. Say in the description WHEN to call it, not what it is. `code` must be a complete async arrow function.",
    inputSchema: `z.object({
    name: z.string().describe("snake_case, e.g. get_weather"),
    description: z.string().describe("When the model should call this"),
    inputs: ${INPUTS_ZOD},
    code: z.string().describe("A complete async arrow function, e.g. async ({ city }) => ({ city, tempC: 21 })"),
  })`,
    examples: `[{
    name: "get_weather",
    description: "Use this whenever the user asks about current weather in a named city.",
    inputs: [{ name: "city", type: "text", description: "e.g. Istanbul" }],
    code: "async ({ city }) => {\\n  const res = await fetch(\`https://api.example.com/weather?city=\${encodeURIComponent(city)}\`);\\n  if (!res.ok) return { found: false, city };\\n  return { found: true, city, ...(await res.json()) };\\n}",
  }]`,
    emit: `{ v: 1, kind: "tool", name: input.name, description: input.description, inputs: input.inputs, code: input.code }`,
    ack: `{ ok: true, created: input.name }`,
  },
  {
    name: "create_agent",
    description: "Create an agent. List in `tools` the names of tools you already created that it should be able to call.",
    inputSchema: `z.object({
    id: z.string().describe("snake_case, e.g. support"),
    purpose: z.string().describe("One line: what this agent is for"),
    instructions: z.string().describe("Its system prompt. Direct, specific, second person."),
    tools: z.array(z.string()).describe("Names of tools it can call"),
  })`,
    examples: `[{
    id: "assistant",
    purpose: "Answers weather questions and cites a source.",
    instructions: "Answer questions about current weather. Call get_weather before answering; never guess.",
    tools: ["get_weather"],
  }]`,
    emit: `{ v: 1, kind: "agent", id: input.id, purpose: input.purpose, instructions: input.instructions, tools: input.tools }`,
    ack: `{ ok: true, created: input.id }`,
  },
  {
    name: "create_subagent",
    description:
      "Create a SPECIALIST agent and expose it as a tool of another agent, in one call. Use this when one agent should hand work to another.",
    inputSchema: `z.object({
    id: z.string().describe("snake_case id of the specialist"),
    purpose: z.string(),
    instructions: z.string(),
    tools: z.array(z.string()).describe("Names of tools the specialist can call"),
    parent: z.string().describe("id of the agent that delegates to it"),
    expose_name: z.string().describe("The tool name the parent calls, e.g. ask_billing"),
    expose_description: z.string().describe("When the parent should delegate"),
  })`,
    examples: `[{
    id: "billing",
    purpose: "Handles billing questions.",
    instructions: "You handle billing. Look up the account before answering about charges.",
    tools: ["lookup_account"],
    parent: "assistant",
    expose_name: "ask_billing",
    expose_description: "Use this when the user asks about charges, invoices, refunds or their plan.",
  }]`,
    emit: `{ v: 1, kind: "subagent", id: input.id, purpose: input.purpose, instructions: input.instructions, tools: input.tools, parent: input.parent, exposeName: input.expose_name, exposeDescription: input.expose_description }`,
    ack: `{ ok: true, created: input.id, exposed_as: input.expose_name }`,
  },
  {
    name: "attach_tool",
    description: "Give an existing tool to an existing agent. Only needed to fix an agent you already created.",
    inputSchema: `z.object({ tool: z.string(), agent: z.string() })`,
    examples: `[{ tool: "get_weather", agent: "assistant" }]`,
    emit: `{ v: 1, kind: "attach", tool: input.tool, agent: input.agent }`,
    ack: `{ ok: true }`,
  },
  {
    name: "remove_decl",
    description: "Delete an agent or tool by name. Use this when the user asks for something to be removed.",
    inputSchema: `z.object({ name: z.string() })`,
    examples: `[{ name: "get_weather" }]`,
    emit: `{ v: 1, kind: "remove", name: input.name }`,
    ack: `{ ok: true }`,
  },
  {
    name: "finish",
    description: "Call this ONCE when the agent is complete. Nothing after it is used.",
    inputSchema: `z.object({
    name: z.string().describe("A short project name, 2-4 words"),
    entry: z.string().describe("id of the agent the run starts at"),
    summary: z.string().describe("One sentence on what you built"),
  })`,
    examples: `[{ name: "Weather desk", entry: "assistant", summary: "An assistant that looks up live weather." }]`,
    emit: `{ v: 1, kind: "finish", name: input.name, entry: input.entry, summary: input.summary }`,
    ack: `{ ok: true, done: true }`,
  },
];

/*
 * Short on purpose. The heavy lifting is each tool's own `description` and `examples`, which the loop
 * injects anyway — restating them here would just spend context twice.
 */
const CREATOR_SYSTEM = [
  "You build AI agents by CALLING TOOLS. Never describe the agent in prose — every part of it must come from a tool call.",
  "Create tools before the agent that uses them, then create the agent listing those tool names.",
  "Tool code must be a complete async arrow function. If you do not know a real endpoint, return a clearly-labelled fixture and say so in the tool description. Never invent API keys.",
  "Keep it small: only the tools the job actually needs.",
  "When the agent is complete, call finish exactly once.",
].join(" ");

/**
 * The exact instruction text that will be sent — what the preview gate renders.
 *
 * An edit carries a STRUCTURAL summary of the project, never tool bodies: the gate promises "not
 * your tool code", and that promise has to stay literally true.
 */
export function creatorPromptFor(req: CreatorRequest): string {
  if (req.kind === "edit") {
    return [`Change this agent project:`, ``, req.summary, ``, `The change to make: ${req.instruction}`].join("\n");
  }
  return [
    `Build an AI agent for this job:`,
    ``,
    req.job.trim(),
    ``,
    `Create the tools it needs, then the agent. Add a specialist sub-agent only if the job really has two distinct roles.`,
  ].join("\n");
}

/**
 * A structural description of a project: ids, kinds, names, descriptions, input names and types.
 *
 * Deliberately excludes every `execute` body. The Designer's edit bar sends this, so what leaves the
 * browser is the shape of the project and nothing the user wrote inside a tool.
 */
export function specSummary(spec: ProjectSpec): string {
  const lines = spec.decls.flatMap((d) => {
    if (d.kind === "tool") {
      const params = paramLine(d.inputSchema.zod);
      return [`tool ${d.name}(${params}) — ${d.description}`];
    }
    if (d.kind === "agent") {
      const instr = typeof d.instructions === "string" ? d.instructions : "(a function of ctx)";
      return [`agent ${d.id} — instructions: ${instr}`, ...(d.tools.length > 0 ? [`  can call: ${d.tools.join(", ")}`] : [])];
    }
    if (d.kind === "subAgentTool") return [`subagent ${d.name} — delegates to agent ${d.agentId} — ${d.description}`];
    return [];
  });
  return [...lines, `the run starts at ${spec.entry.target}`].join("\n");
}

/** `city: text, days: number` from a zod object source — names and types only, never values. */
function paramLine(zod: string): string {
  const inner = /z\.object\(\{([\s\S]*)\}\)/.exec(zod)?.[1] ?? "";
  return inner
    .split(/,(?![^(]*\))/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
    .map((f) => {
      const name = f.split(":")[0]?.trim() ?? "";
      const type = f.includes("z.number()") ? "number" : f.includes("z.boolean()") ? "boolean" : "text";
      return `${name}: ${type}`;
    })
    .join(", ");
}

/** The runnable creator program, on whichever model the user picked. */
export function creatorProgram(req: CreatorRequest, model: ModelSpec): string {
  const provider = providerOf(model);
  const imports = [...providerImportEntries(new Set(provider === undefined ? [] : [provider]))].map(
    ([mod, names]) => `import { ${names.join(", ")} } from ${JSON.stringify(mod)};`,
  );
  const decls = META_TOOLS.map((t) =>
    [
      `const ${t.name} = tool({`,
      `  name: ${JSON.stringify(t.name)},`,
      `  description: ${JSON.stringify(t.description)},`,
      `  inputSchema: ${t.inputSchema},`,
      `  examples: ${t.examples},`,
      `  execute: async (input) => {`,
      // A refusal is information the model can act on; a thrown tool error derails small models.
      `    if (__made.has(input.name ?? input.id ?? "")) return { ok: false, error: "That name already exists — pick another, or use attach_tool." };`,
      `    __made.add(input.name ?? input.id ?? "");`,
      `    emit(${t.emit});`,
      `    return ${t.ack};`,
      `  },`,
      `});`,
    ].join("\n"),
  );
  return [
    // `run` and `emit` are INJECTED by the runner, not exported by `mithril` — importing either
    // shadows the global with undefined and the program dies on first call.
    `import { agent, tool } from "mithril";`,
    ...imports,
    `import { z } from "zod";`,
    ``,
    ...(provider === "groq" ? [GROQ_PROVIDER_DECL, ``] : []),
    `const __made = new Set();`,
    ``,
    ...decls.flatMap((d) => [d, ``]),
    `const creator = agent({`,
    `  model: ${modelExpr(model)},`,
    `  instructions: ${JSON.stringify(CREATOR_SYSTEM)},`,
    `  tools: [${META_TOOLS.map((t) => t.name).join(", ")}],`,
    // No `output:` schema — this is a tool-caller, and the emitted payloads ARE the result.
    `  maxSteps: ${MAX_STEPS},`,
    `});`,
    ``,
    `await run(creator, ${JSON.stringify(creatorPromptFor(req))});`,
  ].join("\n");
}

/** One definition the creator emitted, already validated. */
export type CreatorEvent =
  | { readonly kind: "tool"; readonly name: string; readonly description: string; readonly inputs: readonly DraftInput[]; readonly code: string }
  | { readonly kind: "agent"; readonly id: string; readonly purpose: string; readonly instructions: string; readonly tools: readonly string[] }
  | {
      readonly kind: "subagent";
      readonly id: string;
      readonly purpose: string;
      readonly instructions: string;
      readonly tools: readonly string[];
      readonly parent: string;
      readonly exposeName: string;
      readonly exposeDescription: string;
    }
  | { readonly kind: "attach"; readonly tool: string; readonly agent: string }
  | { readonly kind: "remove"; readonly name: string }
  | { readonly kind: "finish"; readonly name: string; readonly entry: string; readonly summary: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strList = (v: unknown): readonly string[] => (Array.isArray(v) ? v.flatMap((x) => (str(x).length > 0 ? [str(x)] : [])) : []);

function inputList(v: unknown): readonly DraftInput[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((i) => {
    if (!isRecord(i)) return [];
    const name = str(i["name"]);
    if (name.length === 0) return [];
    const t = str(i["type"]);
    return [{ name, type: t === "number" || t === "boolean" ? t : "text", description: str(i["description"]) }];
  });
}

/**
 * Validate the raw `emit` payloads into {@link CreatorEvent}s.
 *
 * Tolerant in the same way {@link https://mithril.dev | parseSpecDraft} is: strict about the fields
 * without which a decl is meaningless, forgiving about everything else, and it drops rather than
 * throws — a model that fumbles one call should not cost you the other five.
 */
export function parseCreatorEvents(data: readonly unknown[]): readonly CreatorEvent[] {
  return data.flatMap((raw): readonly CreatorEvent[] => {
    if (!isRecord(raw)) return [];
    const kind = str(raw["kind"]);
    if (kind === "tool") {
      const name = str(raw["name"]);
      return name.length === 0 ? [] : [{ kind, name, description: str(raw["description"]), inputs: inputList(raw["inputs"]), code: str(raw["code"]) }];
    }
    if (kind === "agent") {
      const id = str(raw["id"]);
      const instructions = str(raw["instructions"]);
      return id.length === 0 || instructions.length === 0 ? [] : [{ kind, id, purpose: str(raw["purpose"]), instructions, tools: strList(raw["tools"]) }];
    }
    if (kind === "subagent") {
      const id = str(raw["id"]);
      const parent = str(raw["parent"]);
      const instructions = str(raw["instructions"]);
      if (id.length === 0 || parent.length === 0 || instructions.length === 0) return [];
      return [
        {
          kind,
          id,
          purpose: str(raw["purpose"]),
          instructions,
          tools: strList(raw["tools"]),
          parent,
          exposeName: str(raw["exposeName"]) || `ask_${id}`,
          exposeDescription: str(raw["exposeDescription"]),
        },
      ];
    }
    if (kind === "attach") {
      const tool = str(raw["tool"]);
      const agent = str(raw["agent"]);
      return tool.length === 0 || agent.length === 0 ? [] : [{ kind, tool, agent }];
    }
    if (kind === "remove") {
      const name = str(raw["name"]);
      return name.length === 0 ? [] : [{ kind, name }];
    }
    if (kind === "finish") return [{ kind, name: str(raw["name"]), entry: str(raw["entry"]), summary: str(raw["summary"]) }];
    return [];
  });
}

/**
 * Is `code` a complete function expression?
 *
 * A scanner, not a parser: it tracks strings, template literals, comments and bracket depth, which is
 * enough to catch the failure that matters — a model returning prose, a fragment, or something with
 * an unclosed brace, all of which would produce a project whose code will not compile. Deliberately
 * no `new Function`: compiling model output on the main thread is a capability this doesn't need.
 */
export function isCompleteFunction(code: string): boolean {
  const trimmed = code.trim();
  if (!/^(async\s+)?(\(|function\b)/.test(trimmed) && !/^async\s*\(/.test(trimmed)) return false;
  let depth = 0;
  let quote: string | null = null;
  let comment: "line" | "block" | null = null;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    const next = trimmed[i + 1];
    if (comment === "line") {
      if (c === "\n") comment = null;
      continue;
    }
    if (comment === "block") {
      if (c === "*" && next === "/") {
        comment = null;
        i++;
      }
      continue;
    }
    if (quote !== null) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && next === "/") {
      comment = "line";
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      comment = "block";
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "(" || c === "{" || c === "[") depth++;
    else if (c === ")" || c === "}" || c === "]") {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0 && quote === null && comment !== "block";
}

/** Something the host had to change or drop, surfaced on the review card rather than hidden. */
export interface BuildNote {
  readonly tone: "warn" | "info";
  readonly text: string;
}

/** A project built from emitted definitions, with everything the host had to fix up. */
export interface BuildResult {
  readonly spec: ProjectSpec;
  readonly notes: readonly BuildNote[];
  /** The creator's own one-line summary, when it called `finish`. */
  readonly summary: string | null;
  /** False when the run ended without `finish` — the build may be incomplete. */
  readonly finished: boolean;
}

/** Assign a decl id that is a valid identifier, unused, and not reserved. */
function claimId(raw: string, fallback: string, taken: Set<string>): string {
  const base = safeIdent(raw, fallback);
  let id = RESERVED_IDS.has(base) ? `${base}_1` : base;
  let n = 1;
  while (taken.has(id)) {
    n++;
    id = `${base}_${n}`;
  }
  taken.add(id);
  return id;
}

/**
 * Turn emitted definitions into a runnable {@link ProjectSpec}.
 *
 * Every created agent runs on the model that created it, for the same reason a draft does: an agent
 * pinned to some other model behaves nothing like the one you just watched being built.
 *
 * With a `base`, this is an EDIT rather than a build: the base's decls are the starting point and the
 * events patch them — a definition whose name already exists replaces that decl instead of adding a
 * second one. That is what lets a one-line instruction ("add a refund tool") be one tool call rather
 * than a re-emission of the whole project, which is where a small model would start dropping things.
 *
 * @param events - validated payloads, in emission order.
 * @param model - the model the creator ran on.
 * @param job - the user's prompt, used to name a project the model never named.
 * @param base - the project being edited, when there is one.
 */
export function creatorToSpec(events: readonly CreatorEvent[], model: ModelSpec, job: string, base?: ProjectSpec): BuildResult {
  const notes: BuildNote[] = [];
  const taken = new Set<string>();
  /** Model-facing name → decl id, so `tools: ["get_weather"]` resolves after id sanitizing. */
  const idOf = new Map<string, string>();

  const tools: ToolSpec[] = [];
  const agents: AgentSpec[] = [];
  const subs: SubAgentToolSpec[] = [];
  /** agent id → tool ids it should be able to call. */
  const wants = new Map<string, string[]>();
  const removed = new Set<string>();
  let finish: Extract<CreatorEvent, { kind: "finish" }> | null = null;

  // Seed from the project being edited, so an untouched decl survives byte-identically and the model
  // only has to describe what changes.
  for (const d of base?.decls ?? []) {
    taken.add(d.id);
    idOf.set(d.id, d.id);
    if (d.kind === "tool") {
      idOf.set(d.name, d.id);
      tools.push(d);
    } else if (d.kind === "agent") {
      agents.push(d);
      wants.set(d.id, [...d.tools]);
    } else if (d.kind === "subAgentTool") {
      idOf.set(d.name, d.id);
      subs.push(d);
    }
  }

  /** Replace a decl of the same kind in place, or claim a fresh id. Returns the id to use. */
  const claimOrReplace = <T extends { readonly kind: string; readonly id: string }>(list: T[], name: string, fallback: string): string => {
    const existingId = idOf.get(name);
    const at = existingId === undefined ? -1 : list.findIndex((d) => d.id === existingId);
    if (at >= 0 && existingId !== undefined) {
      list.splice(at, 1); // the replacement is pushed by the caller, keeping one decl per id
      return existingId;
    }
    return claimId(name, fallback, taken);
  };

  for (const e of events) {
    if (e.kind === "tool") {
      const id = claimOrReplace(tools, e.name, "tool");
      idOf.set(e.name, id);
      const names = e.inputs.map((i) => safeIdent(i.name, "input"));
      const complete = isCompleteFunction(e.code);
      if (!complete && e.code.length > 0) {
        notes.push({ tone: "warn", text: `${id}: the model's body wasn't usable code — replaced with a placeholder.` });
      }
      tools.push({
        kind: "tool",
        id,
        name: id,
        description: e.description,
        inputSchema: { zod: inputsToZod(e.inputs) },
        execute: { code: complete ? e.code : stubBody(names) },
      });
      continue;
    }
    if (e.kind === "agent") {
      const id = claimOrReplace(agents, e.id, "agent");
      idOf.set(e.id, id);
      agents.push({ kind: "agent", id, model, instructions: e.instructions, tools: [] });
      wants.set(id, [...e.tools]);
      continue;
    }
    if (e.kind === "subagent") {
      const id = claimOrReplace(agents, e.id, "agent");
      idOf.set(e.id, id);
      agents.push({ kind: "agent", id, model, instructions: e.instructions, tools: [] });
      wants.set(id, [...e.tools]);
      const wrapperId = claimOrReplace(subs, e.exposeName, `ask_${id}`);
      idOf.set(e.exposeName, wrapperId);
      subs.push({
        kind: "subAgentTool",
        id: wrapperId,
        agentId: id,
        name: wrapperId,
        description: e.exposeDescription,
        // `input` is OMITTED, never `z.object({})`: asTool defaults to `{ task: string }`, and an
        // empty object would leave the parent with no way to pass anything through.
      });
      const parentId = idOf.get(e.parent) ?? safeIdent(e.parent, "agent");
      wants.set(parentId, [...(wants.get(parentId) ?? []), e.exposeName]);
      continue;
    }
    if (e.kind === "attach") {
      const agentId = idOf.get(e.agent) ?? safeIdent(e.agent, "agent");
      wants.set(agentId, [...(wants.get(agentId) ?? []), e.tool]);
      continue;
    }
    if (e.kind === "remove") {
      const id = idOf.get(e.name) ?? safeIdent(e.name, "x");
      removed.add(id);
      continue;
    }
    finish = e;
  }

  const live = (d: { readonly id: string }): boolean => !removed.has(d.id);
  const keptTools = tools.filter(live);
  const keptSubs = subs.filter(live);
  const keptAgents = agents.filter(live);
  const callable = new Set([...keptTools, ...keptSubs].map((d) => d.id));

  // Resolve each agent's wanted tool names against the ids actually created. A tool a model listed
  // but never made is dropped loudly, not silently: codegen would emit a reference to nothing.
  const wired: AgentSpec[] = keptAgents.map((a) => {
    const ids = (wants.get(a.id) ?? []).flatMap((n) => {
      const id = idOf.get(n) ?? safeIdent(n, "x");
      if (!callable.has(id)) {
        notes.push({ tone: "warn", text: `${a.id} was given "${n}", which was never created — dropped.` });
        return [];
      }
      return [id];
    });
    return { ...a, tools: [...new Set(ids)] };
  });

  // Salvage: tools but no agent is the commonest way a small model stalls. An agent that can call
  // what it built is a far better outcome than an error, as long as we say we added it.
  if (base === undefined && wired.length === 0 && keptTools.length > 0) {
    notes.push({ tone: "warn", text: "The model made tools but never created an agent — Studio added one that can call them." });
    wired.push({ kind: "agent", id: claimId("assistant", "assistant", taken), model, instructions: job.trim(), tools: keptTools.map((t) => t.id) });
  }

  // A loose tool is only auto-attached when there is exactly one agent it could belong to. With
  // several, guessing would hide a real modelling mistake — the rail already shows them as loose.
  // Never on an edit: a tool the user deliberately detached must not be re-attached behind their back.
  const attached = new Set(wired.flatMap((a) => a.tools));
  const loose = base === undefined ? keptTools.filter((t) => !attached.has(t.id)) : [];
  const soleAgent = wired[0];
  if (loose.length > 0 && wired.length === 1 && soleAgent !== undefined) {
    notes.push({ tone: "info", text: `Attached ${loose.map((t) => t.id).join(", ")} to ${soleAgent.id} — nothing else could call ${loose.length === 1 ? "it" : "them"}.` });
    wired[0] = { ...soleAgent, tools: [...soleAgent.tools, ...loose.map((t) => t.id)] };
  } else if (loose.length > 0) {
    notes.push({ tone: "warn", text: `No agent can call ${loose.map((t) => t.id).join(", ")}. Drag ${loose.length === 1 ? "it" : "them"} onto one in the Designer.` });
  }

  // The entry is a ROOT: an agent no sub-agent wrapper points at, so a run never starts inside a
  // specialist that was only ever meant to be delegated to.
  const wrapped = new Set(keptSubs.map((s) => s.agentId));
  const named = finish === null ? undefined : idOf.get(finish.entry);
  const stillThere = (id: string | undefined): string | undefined => (id !== undefined && wired.some((a) => a.id === id) ? id : undefined);
  const entryTarget =
    stillThere(named) ??
    // An edit keeps the entry the user chose; only a deleted entry agent moves it.
    stillThere(base?.entry.target) ??
    wired.find((a) => !wrapped.has(a.id))?.id ??
    wired[0]?.id ??
    "";

  const decls: ProjectDecl[] = [...keptTools, ...keptSubs, ...wired];
  const spec: ProjectSpec = {
    specVersion: SPEC_VERSION,
    // On an edit `job` is the instruction, which must never become the project's name.
    name: finish?.name.trim() || base?.name || job.trim().slice(0, 40) || "Untitled agent",
    decls,
    entry: { target: entryTarget, input: base?.entry.input ?? "" },
    ...(base?.meta === undefined ? {} : { meta: base.meta }),
  };

  // createProject writes straight to IndexedDB without passing through projectStore, so order it
  // here too — otherwise the file lands referencing decls before they initialize and only heals on
  // the next open. orderDecls returns the same object when it's already right, so this is free.
  return { spec: orderDecls(spec), notes, summary: finish?.summary.trim() || null, finished: finish !== null };
}
