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
  type OpaqueDecl,
  type ProjectDecl,
  type ProjectSpec,
  type SubAgentToolSpec,
  type ToolSpec,
} from "@mithril/spec";
import { inputsToZod, safeIdent, type DraftInput } from "./drafting.ts";
import { stubBody } from "./tool-fields.ts";
import { orderDecls } from "./order.ts";
import { CAPABILITIES, capabilityCatalogue, capabilityOf, capabilitySetup } from "./capabilities.ts";
import { freeIdentifiers } from "./free-vars.ts";

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
  /** Extra `return { ok: false, error }` guards, emitted before the duplicate check. */
  readonly guards?: readonly string[];
  /** Does this tool introduce a new decl name? Only those take part in duplicate refusal. */
  readonly names?: true;
}[] = [
  {
    name: "create_tool",
    description:
      "Create ONE tool an agent can call. Say in the description WHEN to call it, not what it is. `code` must be a complete async arrow function.",
    inputSchema: `z.object({
    name: z.string().describe("snake_case, e.g. get_weather"),
    description: z.string().describe("When the model should call this"),
    inputs: ${INPUTS_ZOD},
    code: z.string().describe("REQUIRED. The tool's whole body as a complete async arrow function, e.g. async ({ city }) => ({ city, tempC: 21 })"),
  })`,
    examples: `[{
    name: "get_weather",
    description: "Use this whenever the user asks about current weather in a named city.",
    inputs: [{ name: "city", type: "text", description: "e.g. Istanbul" }],
    code: "async ({ city }) => {\\n  const res = await fetch(\`https://api.example.com/weather?city=\${encodeURIComponent(city)}\`);\\n  if (!res.ok) return { found: false, city };\\n  return { found: true, city, ...(await res.json()) };\\n}",
  }]`,
    emit: `{ v: 1, kind: "tool", name: input.name, description: input.description, inputs: input.inputs, code: input.code }`,
    ack: `{ ok: true, created: input.name }`,
    names: true,
    // A missing body used to sail through and land as a silent placeholder. Refusing IN the tool (as
    // data, not a thrown error) is the one feedback channel a small model can actually act on: it
    // gets a second attempt at the field it dropped, in the same loop, before anything is emitted.
    guards: [
      `if (typeof input.code !== "string" || input.code.trim().length === 0) return { ok: false, error: "code is required — send the tool's whole body as a complete async arrow function, e.g. async ({ city }) => ({ city, tempC: 21 }). Call create_tool again with it." };`,
    ],
  },
  {
    name: "use_storage",
    description:
      "Give the agent somewhere to keep data BETWEEN runs. Call this FIRST, before create_tool, whenever the job says remember, note, save, track, history or later. It puts one binding in scope that every tool body can then use directly — no import needed.",
    inputSchema: `z.object({
    backend: z.enum([${CAPABILITIES.map((c) => JSON.stringify(c.id)).join(", ")}]).describe("Which store to use"),
    binding: z.string().describe("The variable name your tool bodies will call it by, e.g. notes"),
  })`,
    examples: `[{ backend: "kv", binding: "facts" }]`,
    emit: `{ v: 1, kind: "storage", backend: input.backend, binding: input.binding }`,
    ack: `{ ok: true, use: input.binding, note: "Reference " + input.binding + " directly in any tool body. Do not import it." }`,
    // The binding IS a top-level name, so it shares the duplicate check with the decl-makers.
    names: true,
    // The enum already constrains this on the wire, but a model that free-texts the field would
    // otherwise emit a payload the host silently drops. Listing the menu in the refusal is the fix.
    guards: [
      `if (![${CAPABILITIES.map((c) => JSON.stringify(c.id)).join(", ")}].includes(input.backend)) return { ok: false, error: "Unknown backend. Pick one of: ${CAPABILITIES.map((c) => c.id).join(", ")}." };`,
    ],
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
    names: true,
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
    names: true,
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
  "Call use_storage first if the agent needs to remember anything, then create tools, then the agent listing those tool names.",
  // `code` is the field small models drop; the whole build is worthless without it, so it is the one
  // thing the system prompt repeats after the tool's own description already said it.
  "Every create_tool call MUST include `code` — a complete async arrow function, never an empty string and never a description of one. If you do not know a real endpoint, return a clearly-labelled fixture and say so in the tool description. Never invent API keys.",
  "Keep it small: only the tools the job actually needs.",
  "When the agent is complete, call finish exactly once.",
  // The catalogue is the whole point of the feature: the model cannot use what it has never been
  // shown, and it must never guess at an API — a plausible-but-wrong method name fails at run time
  // with no type error to catch it first.
  "\n\nA tool body runs in a sandboxed worker. It may use standard JavaScript and `fetch`. It CANNOT import anything — the only extra names in scope are the ones use_storage puts there.\n\nStorage backends available to use_storage:\n" +
    capabilityCatalogue() +
    "\n\nUse EXACTLY the methods listed above; do not invent others. Prefer a persistent backend whenever the job implies remembering across conversations.",
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
      ...(t.guards ?? []).map((g) => `    ${g}`),
      // Duplicate-name refusal, but ONLY for the tools that name something new. `attach_tool` carries
      // neither field, so the old `?? ""` interned the empty string on the first attach and refused
      // every attach after it — the loop lost exactly the calls that wire an agent up.
      // A refusal is information the model can act on; a thrown tool error derails small models.
      ...(t.names
        ? [
            `    const __id = input.name ?? input.id ?? input.binding;`,
            `    if (__made.has(__id)) return { ok: false, error: "That name already exists — pick another, or use attach_tool." };`,
            `    __made.add(__id);`,
          ]
        : []),
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
  | { readonly kind: "storage"; readonly backend: string; readonly binding: string }
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
      return name.length === 0
        ? []
        : [{ kind, name, description: str(raw["description"]), inputs: inputList(raw["inputs"]), code: normalizeFunctionCode(str(raw["code"])) }];
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
    if (kind === "storage") {
      const backend = str(raw["backend"]);
      const binding = str(raw["binding"]);
      // An unknown backend is dropped here rather than carried: `creatorToSpec` could not emit it,
      // and a binding with no setup behind it is exactly the unbound reference this feature exists
      // to prevent. The body that used it still gets its own free-identifier warning.
      return backend.length === 0 || binding.length === 0 || capabilityOf(backend) === undefined ? [] : [{ kind, backend, binding }];
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
 * Strip the wrappers a model puts around a function body that the body itself doesn't need.
 *
 * Models routinely return a correct function inside a markdown fence, or as a named binding
 * (`const getWeather = async (…) => …;`), because that is how functions appear in their training
 * data. Both are perfectly good code that {@link isCompleteFunction} would reject on its first
 * character, and rejecting it costs the user the whole body. Only these three lossless unwraps are
 * applied — a fence, a leading binding or `export default`, and a trailing semicolon. Anything the
 * model actually wrote survives byte-identically.
 */
export function normalizeFunctionCode(raw: string): string {
  const fenced = /^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/.exec(raw.trim());
  return (fenced?.[1] ?? raw)
    .trim()
    .replace(/^export\s+default\s+/, "")
    .replace(/^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*/, "")
    .replace(/;+$/, "")
    .trim();
}

/** Offset of the first character that isn't whitespace or a comment. */
function firstToken(code: string): number {
  let i = 0;
  while (i < code.length) {
    if (/\s/.test(code[i] ?? "")) i++;
    else if (code.startsWith("//", i)) i = code.indexOf("\n", i) === -1 ? code.length : code.indexOf("\n", i);
    else if (code.startsWith("/*", i)) i = code.indexOf("*/", i) === -1 ? code.length : code.indexOf("*/", i) + 2;
    else break;
  }
  return i;
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
  // A leading explanatory comment is a body the user wants, not prose — judge the first real token.
  if (!/^(async\s*)?(\(|function\b)/.test(trimmed.slice(firstToken(trimmed)))) return false;
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

/**
 * Top-level names an opaque statement introduces.
 *
 * Same shape as `orderDecls`'s BINDER, and for the same reason: opaque code is the only decl whose
 * bindings aren't its id, so both the ordering pass and the unbound-reference check have to read
 * them out of the source.
 */
function topLevelBindings(code: string): readonly string[] {
  return [...code.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g)].flatMap((m) =>
    m[1] === undefined ? [] : [m[1]],
  );
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
  /** Capability setup, as opaque decls. Kept separate so it always leads the file. */
  const setup: OpaqueDecl[] = [];
  /** Binding name → the decl id of its `const`, so a repeated use_storage replaces rather than doubles. */
  const bindings = new Map<string, string>();
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
    } else if (d.kind === "opaque") {
      // Hand-written code (and earlier capability setup) survives an edit. Dropping it here would
      // delete whatever you had typed in the Code view the moment you used the instruction bar.
      setup.push(d);
      for (const name of topLevelBindings(d.code)) bindings.set(name, d.id);
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

  /** Opaque ids follow `parseProject`'s own `o1`, `o2`, … so a build round-trips through the code view. */
  let opaqueSeq = setup.length;
  const nextOpaqueId = (): string => {
    opaqueSeq++;
    return `o${opaqueSeq}`;
  };

  for (const e of events) {
    if (e.kind === "storage") {
      const cap = capabilityOf(e.backend);
      if (cap === undefined) continue; // unreachable: parseCreatorEvents already dropped these
      const binding = safeIdent(e.binding, "store");
      if (bindings.has(binding)) continue; // asking twice for the same name is idempotent, not an error
      if (RESERVED_IDS.has(binding)) {
        notes.push({ tone: "warn", text: `Storage binding "${binding}" collides with a framework name — skipped.` });
        continue;
      }
      const [importLine, constLine] = capabilitySetup(cap, binding);
      // TWO decls, not one statement: `parseProject` splits an unplanned import from the const that
      // follows it, so emitting them joined would break `parse(generate(spec)) ≡ spec`.
      setup.push({ kind: "opaque", id: nextOpaqueId(), code: importLine });
      const constDecl: OpaqueDecl = { kind: "opaque", id: nextOpaqueId(), code: constLine };
      setup.push(constDecl);
      bindings.set(binding, constDecl.id);
      taken.add(binding);
      if (!cap.persistent) {
        notes.push({ tone: "info", text: `"${binding}" is in-memory — it starts empty on every run. Switch it to a persistent backend in the Code view to keep data.` });
      }
      continue;
    }
    if (e.kind === "tool") {
      const id = claimOrReplace(tools, e.name, "tool");
      idOf.set(e.name, id);
      const names = e.inputs.map((i) => safeIdent(i.name, "input"));
      // Both stub cases are reported. An omitted `code` is the commonest way a small model shortchanges
      // create_tool, and staying quiet about it is what made a stubbed body look like a design choice.
      const complete = isCompleteFunction(e.code);
      if (!complete) {
        notes.push({
          tone: "warn",
          text:
            e.code.length === 0
              ? `${id}: the model never wrote a body — stubbed. Write it in the Designer, or re-run and ask for real code.`
              : `${id}: the model's body wasn't usable code — replaced with a placeholder.`,
        });
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

  // A body may reference storage bindings and any other decl in the file; anything else is a name
  // the generated code cannot resolve. Warn, never rewrite: a body one setup line short of correct
  // is worth far more than the placeholder that would replace it, and the Designer is where it gets
  // fixed. Same call the "given a tool that was never created" note already makes.
  const inScope = new Set<string>([...bindings.keys(), ...keptTools.map((t) => t.id), ...keptSubs.map((s) => s.id), ...keptAgents.map((a) => a.id)]);
  for (const t of keptTools) {
    const free = freeIdentifiers(t.execute.code, inScope);
    if (free.length > 0) {
      notes.push({
        tone: "warn",
        text: `${t.id} uses ${free.map((n) => `"${n}"`).join(", ")}, which nothing in the project defines — it will throw when called.`,
      });
    }
  }

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

  // Setup leads: an import must be a top-level statement, and the `const` has to initialize before
  // any tool body's decl references it. `orderDecls` would lift it anyway — placing it here means
  // the generated file matches statement-for-statement what `parseProject` reads back.
  const decls: ProjectDecl[] = [...setup.filter(live), ...keptTools, ...keptSubs, ...wired];
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
