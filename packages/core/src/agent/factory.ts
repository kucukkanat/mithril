import type {
  AnyTool,
  EventConsumer,
  JsonValue,
  Middleware,
  MithrilEvent,
  Plugin,
  RunContext,
  RuntimeAdapter,
  StandardSchemaV1,
  Suspend,
  Tool,
  ToolProgress,
} from "../protocol/index.ts";
import { replay } from "../protocol/index.ts";
import type { Agent, AgentConfig, AgentFactory, Input, RunHandle, RunOptions, RunResult, StepSnapshot } from "./agent-types.ts";
import { makeRunHandle } from "./handle.ts";
import { agentLoop, type ResumeState, type ResumeValue, type RunTokenV2 } from "./loop.ts";
import { MithrilError } from "./registry.ts";
import { defaultRuntime } from "./runtime.ts";

// ── tool() ────────────────────────────────────────────────────────────────────────────────────────────
// `In` is recovered from the schema's output, `Out` from execute's NAKED value position (so a non-string
// tool doesn't collapse to `string`); the suspend arm is NoInfer so a pure-suspend Tier-1b tool doesn't
// infer Out = Suspend<…>. JSON-safety is the `Out extends JsonValue` constraint.
type Infer<S extends StandardSchemaV1> = StandardSchemaV1.InferOutput<S>;

/**
 * The definition object passed to {@link tool} to declare a single tool.
 *
 * @typeParam Name - the tool's literal name (kept `const` so the model call site sees the exact string).
 * @typeParam SIn - the input {@link https://standardschema.dev | Standard Schema}; its output type becomes `execute`'s input.
 * @typeParam Deps - the dependency object reachable via `ctx.deps` inside `execute`.
 * @typeParam Out - the tool's JSON-safe return type (constrained to `JsonValue`).
 * @remarks
 * - `inputSchema` validates the model-supplied arguments before `execute` runs; invalid input throws
 *   {@link MithrilError} `INVALID_TOOL_INPUT`.
 * - `needsApproval` gates the call behind Tier-1 HITL: a `true` result suspends the run for approval.
 * - `execute` may return the value directly or be an `AsyncGenerator` that yields {@link ToolProgress}
 *   before returning the value. It may also return `suspend(...)` to pause the run (Tier-1b), or call
 *   `ctx.suspend(...)` to pause mid-execution (Tier-2).
 */
export interface ToolDef<Name extends string, SIn extends StandardSchemaV1, Deps, Out extends JsonValue> {
  name: Name;
  description: string;
  version?: string;
  inputSchema: SIn;
  outputSchema?: StandardSchemaV1<unknown, Out>;
  needsApproval?: boolean | ((input: Infer<SIn>, ctx: RunContext<Deps>) => boolean | Promise<boolean>);
  execute: (
    input: Infer<SIn>,
    ctx: RunContext<Deps>,
  ) => Promise<Out | Suspend<NoInfer<Out>>> | AsyncGenerator<ToolProgress, Out | Suspend<NoInfer<Out>>>;
}

/**
 * A `Deps`-bound tool constructor: call it with a {@link ToolDef} to get a fully typed {@link Tool}.
 *
 * @typeParam Deps - the dependency object every tool built by this factory receives via `ctx.deps`.
 * @remarks Returned by `tool<Deps>()` and by {@link createHarness}, so each tool definition need not
 * restate `<Deps>`. `Name`, the input type, and `Out` are all inferred from the def.
 */
export interface ToolFactory<Deps> {
  <const Name extends string, SIn extends StandardSchemaV1, Out extends JsonValue = string>(
    def: ToolDef<Name, SIn, Deps, Out>,
  ): Tool<Name, Infer<SIn>, Out, Deps>;
}

/**
 * Define a tool, or curry over `Deps` first.
 *
 * @remarks Two forms:
 * - `tool<Deps>()` returns a {@link ToolFactory} that binds `Deps` for every subsequent definition.
 * - `tool(def)` defines a single tool inline (dependency-free unless bound via {@link createHarness}).
 *
 * The definition is returned essentially as-is; the value of this helper is the type inference it drives
 * (tool name, validated input type, and JSON-safe output type).
 *
 * @param def - the {@link ToolDef}, omitted in the curried form.
 * @returns the typed {@link Tool}, or a {@link ToolFactory} when called with no arguments.
 * @example
 * ```ts
 * import { tool } from "@mithril/core/agent";
 * import { z } from "zod";
 *
 * const getWeather = tool({
 *   name: "get_weather",
 *   description: "Look up the current weather for a city.",
 *   inputSchema: z.object({ city: z.string() }),
 *   async execute({ city }) {
 *     return `It is 22°C in ${city}.`;
 *   },
 * });
 * ```
 */
export function tool<Deps>(): ToolFactory<Deps>;
export function tool<const Name extends string, SIn extends StandardSchemaV1, Out extends JsonValue = string>(
  def: ToolDef<Name, SIn, unknown, Out>,
): Tool<Name, Infer<SIn>, Out, unknown>;
export function tool(def?: unknown): unknown {
  if (def === undefined) return (d: unknown): unknown => d;
  return def;
}

// ── §3.8 plugins & middleware assembly ────────────────────────────────────────────────────────────────
function isPlugin<Deps>(x: Plugin<Deps> | Middleware<Deps>): x is Plugin<Deps> {
  return "tools" in x || "middleware" in x || "consumers" in x || "setup" in x;
}
function flattenUse<Deps>(
  use: readonly (Plugin<Deps> | Middleware<Deps>)[] | undefined,
): { readonly middlewares: Middleware<Deps>[]; readonly consumers: EventConsumer[]; readonly tools: AnyTool<Deps>[] } {
  const middlewares: Middleware<Deps>[] = [];
  const consumers: EventConsumer[] = [];
  const tools: AnyTool<Deps>[] = [];
  for (const item of use ?? []) {
    if (isPlugin(item)) {
      if (item.tools !== undefined) tools.push(...item.tools);
      if (item.middleware !== undefined) middlewares.push(...item.middleware);
      if (item.consumers !== undefined) consumers.push(...item.consumers);
    } else {
      middlewares.push(item); // depth-first, plugin middleware at the plugin's position
    }
  }
  return { middlewares, consumers, tools };
}

/**
 * Define a plugin — a reusable bundle of tools, middleware, and event consumers — or curry over `Deps`.
 *
 * @remarks Curried like {@link tool}/{@link agent}: `plugin<Deps>()(def)` binds `Deps`; `plugin(def)`
 * covers the no-deps case. The definition is returned as-is; the helper exists purely for type inference.
 * Pass the result to {@link AgentConfig}'s `use` array. A plugin's `tools` are merged with the agent's own
 * `tools`, its `middleware` is inserted at the plugin's position (depth-first), and its `consumers`
 * subscribe to every emitted event.
 * @param p - the {@link Plugin} definition, omitted in the curried form.
 * @returns the plugin, or a `Deps`-bound plugin factory when called with no arguments.
 */
export function plugin<Deps>(): <const Tools extends readonly AnyTool<Deps>[] = []>(p: Plugin<Deps, Tools>) => Plugin<Deps, Tools>;
export function plugin<const Tools extends readonly AnyTool<unknown>[] = []>(p: Plugin<unknown, Tools>): Plugin<unknown, Tools>;
export function plugin(p?: unknown): unknown {
  if (p === undefined) return (x: unknown): unknown => x;
  return p;
}

// ── agent() / createHarness() ───────────────────────────────────────────────────────────────────────────
type LooseConfig = AgentConfig<readonly AnyTool<unknown>[], unknown, JsonValue>;

// Link an internal AbortController to a caller-supplied signal, so handle.cancel() and the external signal
// both abort the run.
function linkSignal(ctrl: AbortController, external: AbortSignal | undefined): void {
  if (external === undefined) return;
  // Forward the external signal's reason so a caller-supplied AbortSignal.timeout(ms)/abort(reason) surfaces
  // on the run.cancel event, rather than being flattened to the generic "aborted" label.
  if (external.aborted) ctrl.abort(external.reason);
  else external.addEventListener("abort", () => ctrl.abort(external.reason), { once: true });
}

function makeAgent<Tools extends readonly AnyTool<Deps>[], Deps, Out extends JsonValue>(
  config: AgentConfig<Tools, Deps, Out>,
): Agent<Tools, Deps, Out> {
  const flat = flattenUse<Deps>(config.use);
  const allTools = [...((config.tools ?? []) as readonly AnyTool<Deps>[]), ...flat.tools];
  const build = (
    input: Input,
    o: RunOptions<Deps> | undefined,
    extra?: { readonly runId?: string; readonly resume?: ResumeState; readonly signal?: AbortSignal },
  ): AsyncGenerator<MithrilEvent, RunResult<Out>> => {
    const signal = extra?.signal ?? o?.signal;
    return agentLoop<Deps>({
      model: config.model,
      instructions: config.instructions,
      tools: allTools,
      input,
      deps: o?.deps as Deps,
      ...(o?.transport !== undefined ? { transport: o.transport } : {}),
      ...(o?.providers !== undefined ? { providers: o.providers } : {}),
      ...(o?.runtime !== undefined ? { runtime: o.runtime } : {}),
      ...(signal !== undefined ? { signal } : {}),
      ...(o?.maxSteps ?? config.maxSteps ? { maxSteps: o?.maxSteps ?? config.maxSteps } : {}),
      ...(config.output !== undefined ? { output: config.output } : {}),
      ...(config.outputRetries !== undefined ? { outputRetries: config.outputRetries } : {}),
      ...(flat.middlewares.length > 0 ? { middlewares: flat.middlewares } : {}),
      ...(flat.consumers.length > 0 ? { consumers: flat.consumers } : {}),
      ...(extra?.runId !== undefined ? { runId: extra.runId } : {}),
      ...(extra?.resume !== undefined ? { resume: extra.resume } : {}),
      // agentLoop returns RunResult<JsonValue>; the validated output IS Out at runtime — typed at the boundary.
    }) as AsyncGenerator<MithrilEvent, RunResult<Out>>;
  };

  const toResumeState = (token: string, resolution: ResumeValue): ResumeState => {
    const parsed = JSON.parse(token) as RunTokenV2;
    if (parsed.v !== 2) throw new MithrilError("BAD_TOKEN", "Unsupported run-token version.");
    return { messages: parsed.messages, usage: parsed.usage, step: parsed.step, pending: parsed.pending, resolution };
  };

  const drain = async (gen: AsyncGenerator<MithrilEvent, RunResult<Out>>): Promise<RunResult<Out>> => {
    for (;;) {
      const r = await gen.next();
      if (r.done) return r.value;
    }
  };

  const rt = (o: RunOptions<Deps> | undefined): RuntimeAdapter => o?.runtime ?? defaultRuntime();

  // Open a streaming handle over a run built by `make`, wiring cancel() (internal AbortController) and
  // in-process resolve() (rebuild from the suspension token, streamed).
  const streamFrom = (
    make: (signal: AbortSignal, runId: string) => AsyncGenerator<MithrilEvent, RunResult<Out>>,
    o: RunOptions<Deps> | undefined,
  ): RunHandle<Out> => {
    const ctrl = new AbortController();
    linkSignal(ctrl, o?.signal);
    const runId = rt(o).randomUUID();
    const gen = make(ctrl.signal, runId);
    const resume = (token: string, resolution: ResumeValue): RunHandle<Out> =>
      streamFrom((sig, rid) => build("", o, { resume: toResumeState(token, resolution), signal: sig, runId: rid }), o);
    return makeRunHandle<Out>(gen, runId, { cancel: (reason?: string) => ctrl.abort(reason), resume });
  };

  // Step-level control: drive the loop, yielding a snapshot at each step boundary. Abandoning the iterator
  // (break/return) runs the finally, which aborts the run.
  async function* iterate(input: Input, o: RunOptions<Deps> | undefined): AsyncGenerator<StepSnapshot, RunResult<Out>> {
    const ctrl = new AbortController();
    linkSignal(ctrl, o?.signal);
    const runId = rt(o).randomUUID();
    const gen = build(input, o, { runId, signal: ctrl.signal });
    const all: MithrilEvent[] = [];
    let sinceStep: MithrilEvent[] = [];
    try {
      for (;;) {
        const r = await gen.next();
        if (r.done) return r.value;
        all.push(r.value);
        sinceStep.push(r.value);
        if (r.value.type === "step.finish") {
          const snapshot: StepSnapshot = { step: r.value.step, events: sinceStep, state: replay(all) };
          sinceStep = [];
          yield snapshot;
        }
      }
    } finally {
      ctrl.abort(); // caller broke out early ⇒ cancel the underlying run
    }
  }

  // `args` is the conditional RunArgs tuple; `args[0]` is `RunOptions<Deps> | RunOptions<void> | undefined`.
  // They differ only in `deps` (void vs Deps), which for a void-Deps agent is void anyway — narrow here.
  return {
    run(input, ...args) {
      return drain(build(input, args[0] as RunOptions<Deps> | undefined));
    },
    stream(input, ...args) {
      const o = args[0] as RunOptions<Deps> | undefined;
      return streamFrom((sig, rid) => build(input, o, { signal: sig, runId: rid }), o);
    },
    iterate(input, ...args) {
      return iterate(input, args[0] as RunOptions<Deps> | undefined);
    },
    resume(token, resolution, ...args) {
      const o = args[0] as RunOptions<Deps> | undefined;
      return drain(build("", o, { resume: toResumeState(token, resolution) }));
    },
    resumeStream(token, resolution, ...args) {
      const o = args[0] as RunOptions<Deps> | undefined;
      return streamFrom((sig, rid) => build("", o, { resume: toResumeState(token, resolution), signal: sig, runId: rid }), o);
    },
  };
}

/**
 * Build a runnable {@link Agent} from an {@link AgentConfig}, or curry over `Deps` first.
 *
 * @remarks Two forms:
 * - `agent<Deps>()` returns an {@link AgentFactory} that binds `Deps` for the config.
 * - `agent(config)` builds a no-deps agent (`Deps = void`) directly.
 *
 * `Tools` and `Out` are inferred from the config, so tool typings and the structured-output type flow
 * through to {@link RunResult}.
 * @param config - the {@link AgentConfig}, omitted in the curried form.
 * @returns the built {@link Agent}, or an {@link AgentFactory} when called with no arguments.
 * @example
 * ```ts
 * import { agent, tool } from "@mithril/core/agent";
 * import { z } from "zod";
 *
 * const assistant = agent({
 *   model: "anthropic/claude-sonnet-4",
 *   instructions: "You are a concise assistant.",
 *   tools: [
 *     tool({
 *       name: "add",
 *       description: "Add two numbers.",
 *       inputSchema: z.object({ a: z.number(), b: z.number() }),
 *       async execute({ a, b }) {
 *         return a + b;
 *       },
 *     }),
 *   ],
 * });
 *
 * const result = await assistant.run("What is 2 + 2?");
 * if (result.status === "completed") console.log(result.output);
 * ```
 */
export function agent<Deps>(): AgentFactory<Deps>;
export function agent<const Tools extends readonly AnyTool<void>[] = [], const Out extends JsonValue = string>(
  config: AgentConfig<Tools, void, Out>,
): Agent<Tools, void, Out>;
export function agent(config?: unknown): unknown {
  if (config === undefined) return (c: LooseConfig) => makeAgent(c);
  return makeAgent(config as LooseConfig);
}

/**
 * Bind `Deps` once for a whole app and get back `Deps`-typed {@link agent} and {@link tool} factories.
 *
 * @typeParam Deps - the shared dependency object all agents and tools in this harness receive.
 * @returns an object with `agent` ({@link AgentFactory}), `tool` ({@link ToolFactory}), and `plugin`
 * (a `Deps`-bound {@link plugin} factory), so no individual definition has to restate `<Deps>()`.
 * @example
 * ```ts
 * import { createHarness } from "@mithril/core/agent";
 *
 * type Deps = { readonly db: Database };
 * const { agent, tool } = createHarness<Deps>();
 *
 * const lookup = tool({
 *   name: "lookup_user",
 *   description: "Fetch a user by id.",
 *   inputSchema: z.object({ id: z.string() }),
 *   async execute({ id }, ctx) {
 *     return ctx.deps.db.users.get(id);
 *   },
 * });
 *
 * const app = agent({ model: "anthropic/claude-sonnet-4", instructions: "…", tools: [lookup] });
 * await app.run("Who is user 42?", { deps: { db } });
 * ```
 */
export function createHarness<Deps>(): {
  readonly agent: AgentFactory<Deps>;
  readonly tool: ToolFactory<Deps>;
  readonly plugin: <const Tools extends readonly AnyTool<Deps>[] = []>(p: Plugin<Deps, Tools>) => Plugin<Deps, Tools>;
} {
  return {
    agent: ((c: AgentConfig<readonly AnyTool<Deps>[], Deps, JsonValue>) => makeAgent(c)) as AgentFactory<Deps>,
    tool: ((d: unknown) => d) as ToolFactory<Deps>,
    plugin: (<Tools extends readonly AnyTool<Deps>[]>(p: Plugin<Deps, Tools>) => p) as <
      const Tools extends readonly AnyTool<Deps>[] = [],
    >(p: Plugin<Deps, Tools>) => Plugin<Deps, Tools>,
  };
}

// ── asTool() — a sub-agent as a tool ────────────────────────────────────────────────────────────────────
// Minimal hand-written Standard Schemas (core carries no validator dependency).
function taskSchema(): StandardSchemaV1<unknown, { readonly task: string }> {
  return {
    "~standard": {
      version: 1,
      vendor: "mithril",
      validate(v) {
        const task = (v as { task?: unknown } | null)?.task;
        return typeof task === "string" ? { value: { task } } : { issues: [{ message: "expected { task: string }" }] };
      },
    },
  };
}

/**
 * Options for {@link asTool}: how a sub-agent is exposed as a callable tool.
 *
 * @typeParam In - the tool's validated input type (defaults to `{ task: string }`).
 * @typeParam ChildDeps - the sub-agent's dependency type, provided per call via {@link AsToolOptions.deps}.
 */
export interface AsToolOptions<In, ChildDeps> {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  /** Input schema; defaults to `{ task: string }`. Supply {@link AsToolOptions.input} when you change it. */
  readonly inputSchema?: StandardSchemaV1<unknown, In>;
  /** Map the validated tool input to the sub-agent's run input; defaults to `input.task` (or the raw string). */
  readonly input?: (input: In) => Input;
  /** Provide the sub-agent's dependencies from the calling tool's {@link RunContext}. */
  readonly deps?: (ctx: RunContext<unknown>) => ChildDeps;
  /** Gate the sub-agent call behind Tier-1 approval. */
  readonly needsApproval?: boolean;
}

/**
 * Wrap an {@link Agent} as a {@link Tool}, so one agent can call another as a sub-agent.
 *
 * @typeParam In - the tool input type; defaults to `{ task: string }`.
 * @typeParam ChildDeps - the sub-agent's dependency type.
 * @typeParam COut - the sub-agent's output type, returned as the tool result.
 * @param child - the sub-agent to expose.
 * @param opts - naming, schema, input mapping, and dependency wiring ({@link AsToolOptions}).
 * @returns a {@link Tool} whose `execute` runs the sub-agent to completion and returns its output.
 * @remarks **Nested HITL is first-class.** If the sub-agent suspends (its own approval or `ctx.suspend`),
 * this tool suspends the *parent* via Tier-2 with a `handoff.suspended` request whose payload carries the
 * child's pending `child` descriptor. Resume the parent run with `{ kind: "resolve", value: <the child's
 * ResumeValue> }` (an `ApprovalDecision`, or `{ kind: "resolve", value }`): the tool resumes the child with
 * it, loops until the child finishes, and returns its output — all through the parent's own token, across as
 * many nested pauses as the child needs. The child run is journaled, so it is never re-executed on resume. A
 * sub-agent `error`/`cancel` surfaces as a {@link MithrilError} (`SUBAGENT_ERROR`/`SUBAGENT_CANCELLED`).
 * @example
 * ```ts
 * import { agent, asTool } from "@mithril/core/agent";
 *
 * const researcher = agent({ model, instructions: "Research the question thoroughly." });
 * const lead = agent({
 *   model,
 *   instructions: "Delegate research, then summarize.",
 *   tools: [asTool(researcher, { name: "research", description: "Deep-dive a question." })],
 * });
 * ```
 */
export function asTool<In, ChildDeps, COut extends JsonValue>(
  child: Agent<readonly AnyTool<ChildDeps>[], ChildDeps, COut>,
  opts: AsToolOptions<In, ChildDeps>,
): Tool<string, In, COut, unknown> {
  const inputSchema = (opts.inputSchema ?? taskSchema()) as StandardSchemaV1<unknown, In>;
  const toInput =
    opts.input ??
    ((i: In): Input => {
      if (typeof i === "string") return i;
      const task = (i as { task?: unknown }).task;
      return typeof task === "string" ? task : JSON.stringify(i);
    });
  const runChild = child.run as (input: Input, o: RunOptions<ChildDeps>) => Promise<RunResult<COut>>;
  const resumeChild = child.resume as (token: string, resolution: ResumeValue, o: RunOptions<ChildDeps>) => Promise<RunResult<COut>>;

  const settle = (res: RunResult<COut>): COut => {
    if (res.status === "completed") return res.output;
    if (res.status === "error") throw new MithrilError("SUBAGENT_ERROR", `sub-agent "${opts.name}" failed: ${res.error.message}`);
    if (res.status === "cancelled") throw new MithrilError("SUBAGENT_CANCELLED", `sub-agent "${opts.name}" was cancelled`);
    throw new MithrilError("SUBAGENT_UNRESUMABLE", `sub-agent "${opts.name}" is unresumable`);
  };

  const t = {
    name: opts.name,
    description: opts.description,
    ...(opts.version !== undefined ? { version: opts.version } : {}),
    inputSchema,
    ...(opts.needsApproval !== undefined ? { needsApproval: opts.needsApproval } : {}),
    async execute(input: In, ctx: RunContext<unknown>): Promise<COut> {
      // Cast to RunOptions<ChildDeps>: DepsOption's conditional can't resolve against a free `ChildDeps`.
      const runOpts = { deps: (opts.deps?.(ctx) ?? undefined) as ChildDeps } as RunOptions<ChildDeps>;
      // Journaled so a Tier-2 replay of THIS execute never re-runs the child (exactly-once).
      let res = await ctx.journal<RunResult<COut>>("child.run", () => runChild(toInput(input), runOpts));
      let hop = 0;
      while (res.status === "suspended") {
        // Ask the parent's caller for the child's resolution, then resume the child with it.
        const token = res.token;
        const resolution = (await ctx.suspend({
          kind: "handoff.suspended",
          payload: { to: opts.name, child: res.request },
          resolutionSchemaId: "mithril.handoff",
        })) as ResumeValue;
        res = await ctx.journal<RunResult<COut>>(`child.resume.${hop}`, () => resumeChild(token, resolution, runOpts));
        hop++;
      }
      return settle(res);
    },
  };
  return t as Tool<string, In, COut, unknown>;
}
