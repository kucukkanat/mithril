import {
  addUsage,
  type AnyTool,
  type ApprovalDecision,
  type ChatRequest,
  type EventConsumer,
  type EventMeta,
  type FinishReason,
  isSuspend,
  type JsonValue,
  type Middleware,
  type MiddlewareContext,
  type MithrilEvent,
  type ModelCall,
  type ModelInput,
  type ModelResult,
  type ProviderChunk,
  type ProviderRegistry,
  type RunContext,
  type RuntimeAdapter,
  type SpanRef,
  type StandardSchemaV1,
  type StepInput,
  type StepOutcome,
  type SuspensionDescriptor,
  type SuspensionRequest,
  type ToolInvocation,
  type ToolOutcome,
  type Transport,
  type UsageDelta,
  type UsageTotals,
  ZERO_USAGE,
} from "../protocol/index.ts";
import { type Input, inputToJson, type RunResult, toSerializedError } from "./agent-types.ts";
import { globalConsumers } from "./global-consumers.ts";
import { MithrilError, resolveModel, resolveTransport } from "./registry.ts";
import { defaultRuntime } from "./runtime.ts";

const ZERO_DELTA: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
const APPROVAL_SCHEMA_ID = "mithril.approval";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type EventBody = DistributiveOmit<MithrilEvent, keyof EventMeta>;

interface Call {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
}
interface LoopMessage {
  readonly role: string;
  readonly content: string;
  readonly toolCalls: readonly Call[];
}

/** How a run paused, so {@link agentLoop} can dispatch the right resume behavior. */
export type PendingKind = "approval" | "return" | "midtool";

/**
 * The serialized description of what a suspended run is waiting on — enough to resume it in another
 * process. `approval` (Tier-1) resumes with an {@link ApprovalDecision}; `return` (Tier-1b, a tool
 * returned `suspend(...)`) and `midtool` (Tier-2, `ctx.suspend()`) resume with a resolution value.
 */
export interface PendingSuspension {
  readonly kind: PendingKind;
  readonly callId: string;
  readonly descriptor: SuspensionDescriptor;
  /** Tier-2 only: journaled effect values recorded before the pause, replayed on resume. */
  readonly journal?: Readonly<Record<string, JsonValue>>;
  /** Tier-2 only: resolutions consumed by prior `ctx.suspend()` calls, replayed in order on resume. */
  readonly resolutions?: readonly JsonValue[];
}

/** The value supplied to resume a suspended run: an approval decision, or an arbitrary resolution value. */
export type ResumeValue = ApprovalDecision<JsonValue> | { readonly kind: "resolve"; readonly value: JsonValue };

/** The reconstructed loop state driving a resume, assembled by {@link agent} from a run token. */
export interface ResumeState {
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
  readonly resolution: ResumeValue;
}

/** The versioned, serializable run token carried by a `suspended` {@link RunResult}. */
export interface RunTokenV2 {
  readonly v: 2;
  readonly runId: string;
  readonly model: string;
  readonly messages: readonly LoopMessage[];
  readonly usage: UsageTotals;
  readonly step: number;
  readonly pending: PendingSuspension;
}

// The internal directive applied to the first pending tool call on resume. `approve`/`reject`/`edit` are the
// Tier-1 approval arms; `return` feeds a Tier-1b resolution as the tool result; `midtool` re-runs the tool's
// execute with the recorded journal + resolutions (Tier-2 replay).
type Directive =
  | ApprovalDecision<JsonValue>
  | { readonly kind: "return"; readonly value: JsonValue }
  | { readonly kind: "midtool"; readonly journal: Readonly<Record<string, JsonValue>>; readonly resolutions: readonly JsonValue[]; readonly value: JsonValue };

// Internal unwinding signal for ctx.suspend() (Tier-2) and a tool-returned suspend marker (Tier-1b). Never
// escapes the loop: runToolCalls catches it and turns it into a serializable PendingSuspension. A unique
// class (not a plain Error) so overly-broad user `catch` blocks are less likely to swallow it silently.
class SuspendSignal {
  constructor(
    readonly kind: "return" | "midtool",
    readonly request: SuspensionRequest,
    readonly journal: Readonly<Record<string, JsonValue>>,
    readonly resolutions: readonly JsonValue[],
  ) {}
}

// Mutable per-execution replay state. Fresh runs start empty; a Tier-2 resume seeds journal + priorResolutions.
interface ExecState {
  journal: Record<string, JsonValue>;
  readonly priorResolutions: readonly JsonValue[];
  ordinal: number;
}

/**
 * The full set of inputs to {@link agentLoop} — the flattened, already-resolved form of an
 * {@link AgentConfig} plus per-run options.
 *
 * @typeParam Deps - the dependency object injected into tool/instruction contexts.
 * @remarks This is the loop's low-level contract: {@link agent} assembles it from config + `RunOptions`.
 * `transport`/`providers`/`runtime` omitted fall back to environment BYOK, the model handle's provider,
 * and {@link defaultRuntime} respectively. `resume` drives the cross-process resume path; `output` +
 * `outputRetries` drive structured output. `maxSteps` defaults to 16, `outputRetries` to 2.
 */
export interface LoopOptions<Deps> {
  readonly model: ModelInput;
  readonly instructions: string | ((ctx: RunContext<Deps>) => string | Promise<string>);
  readonly tools: readonly AnyTool<Deps>[];
  readonly input: Input;
  readonly deps: Deps;
  readonly transport?: Transport;
  readonly providers?: ProviderRegistry;
  readonly runtime?: RuntimeAdapter;
  readonly signal?: AbortSignal;
  readonly maxSteps?: number;
  readonly runId?: string;
  readonly resume?: ResumeState;
  readonly output?: StandardSchemaV1<unknown, JsonValue>;
  readonly outputRetries?: number;
  readonly middlewares?: readonly Middleware<Deps>[];
  readonly consumers?: readonly EventConsumer[];
}

const OUTPUT_HINT = "\n\nRespond with ONLY a single JSON object that matches the required schema.";

function issuesToJson(issues: readonly { readonly message: string }[]): JsonValue {
  return issues.map((i) => ({ message: i.message }));
}

function reqToDescriptor(req: SuspensionRequest, callId: string): SuspensionDescriptor {
  return { kind: req.kind, callId, payload: req.payload, resolutionSchemaId: req.resolutionSchemaId };
}

// Best-effort "partial JSON": close any open strings/objects/arrays so an in-progress structured response
// parses into a deep-partial object for `object.delta` streaming.
function tryPartialJson(s: string): JsonValue | undefined {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = inStr ? `${s}"` : s;
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  try {
    return JSON.parse(out) as JsonValue;
  } catch {
    return undefined;
  }
}

function isAsyncGen(v: unknown): v is AsyncGenerator<{ readonly payload: JsonValue }, unknown> {
  return typeof v === "object" && v !== null && Symbol.asyncIterator in v;
}

async function validateInput(schema: StandardSchemaV1<unknown, unknown>, input: JsonValue): Promise<JsonValue> {
  const r = await schema["~standard"].validate(input);
  if (r.issues !== undefined) {
    throw new MithrilError("INVALID_TOOL_INPUT", `invalid tool input: ${r.issues.map((i) => i.message).join("; ")}`);
  }
  return r.value as JsonValue;
}

// Remaining tool calls of the last assistant turn that have not yet produced a tool result. The first is
// the one awaiting approval/resolution; a token serializes enough to recompute this on resume.
function pendingCalls(messages: readonly LoopMessage[]): readonly Call[] {
  let ai = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m !== undefined && m.role === "assistant" && m.toolCalls.length > 0) {
      ai = i;
      break;
    }
  }
  if (ai < 0) return [];
  const assistant = messages[ai];
  if (assistant === undefined) return [];
  const executed = messages.slice(ai + 1).filter((m) => m.role === "tool").length;
  return assistant.toolCalls.slice(executed);
}

/**
 * The core streaming agent loop: drives model turns and tool execution, emitting {@link MithrilEvent}s and
 * returning a terminal {@link RunResult}.
 *
 * @typeParam Deps - the dependency object injected into tool/instruction contexts.
 * @param opts - the resolved {@link LoopOptions}.
 * @returns an `AsyncGenerator` that yields every run event and finally returns the {@link RunResult}. The
 * result's `output` is typed as `JsonValue` here; {@link agent} narrows it to the config's `Out`.
 * @throws {@link MithrilError} on unresolvable model/provider or invalid tool input (`INVALID_TOOL_INPUT`).
 * @remarks Each iteration is one step (bounded by `maxSteps`, default 16). A step calls the model, streams
 * its chunks, then either finishes (text or validated structured output), runs the requested tool calls, or
 * suspends. Three suspension tiers are wired: Tier-1 approval (`needsApproval`), Tier-1b (a tool returns
 * `suspend(...)`), and Tier-2 (`ctx.suspend()` mid-execute, resumed by replaying journaled effects).
 * Middleware wraps both the model call and each tool invocation. Consumers see every stamped event.
 * Aborting `opts.signal` returns a `"cancelled"` result at the next step boundary.
 * @example
 * ```ts
 * import { agentLoop } from "@mithril/core/agent";
 *
 * const gen = agentLoop({
 *   model: myModelHandle,
 *   instructions: "Be brief.",
 *   tools: [],
 *   input: "Hello",
 *   deps: undefined,
 * });
 * for (;;) {
 *   const next = await gen.next();
 *   if (next.done) {
 *     console.log("result:", next.value);
 *     break;
 *   }
 *   console.log("event:", next.value.type);
 * }
 * ```
 */
export async function* agentLoop<Deps>(opts: LoopOptions<Deps>): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
  const rt = opts.runtime ?? defaultRuntime();
  const signal = opts.signal ?? new AbortController().signal;
  const { id: modelId, provider } = resolveModel(opts.model, opts.providers);
  const transport = resolveTransport(opts.transport, modelId);

  const runId = opts.runId ?? rt.randomUUID();
  const traceId = rt.randomUUID();
  const rootSpan: SpanRef = { id: rt.randomUUID(), parentId: null, traceId, kind: "invoke_agent" };
  let seq = 0;
  let usage: UsageTotals = ZERO_USAGE;
  const messages: LoopMessage[] = [];
  // §9.2 — run-scoped consumers plus any process-wide ones (zero-touch devtools attach).
  const consumers = [...(opts.consumers ?? []), ...globalConsumers()];
  const middlewares = opts.middlewares ?? [];

  function stamp(span: SpanRef, body: EventBody): MithrilEvent {
    const e = { v: 1, runId, seq: seq++, ts: rt.now(), span, ...body } as MithrilEvent;
    for (const c of consumers) c.onEvent(e); // §3.8 consumers see every event (pure subscribers)
    return e;
  }
  // Context for instructions/needsApproval predicates: no tool-execution replay state (suspend/journal are
  // inert here — an instruction function that suspends is not a supported shape).
  const makeCtx = (step: number, span: SpanRef, emitted: MithrilEvent[]): RunContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    usage,
    runtime: rt,
    emit(payload, type) {
      emitted.push(stamp(span, { type: type ?? "custom.emit", payload }));
    },
    suspend() {
      return Promise.reject(new MithrilError("NOT_IMPLEMENTED", "ctx.suspend() is only available inside a tool's execute()."));
    },
    journal(_key, fn) {
      return fn();
    },
  });
  // Context for a tool's execute(): suspend()/journal() are wired to the replay state so Tier-2 works.
  const makeExecCtx = (step: number, span: SpanRef, emitted: MithrilEvent[], exec: ExecState): RunContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    usage,
    runtime: rt,
    emit(payload, type) {
      emitted.push(stamp(span, { type: type ?? "custom.emit", payload }));
    },
    async suspend<Req extends SuspensionRequest>(req: Req) {
      const ord = exec.ordinal++;
      if (ord < exec.priorResolutions.length) return exec.priorResolutions[ord] as never;
      throw new SuspendSignal("midtool", req, exec.journal, exec.priorResolutions);
    },
    async journal(key, fn) {
      if (Object.hasOwn(exec.journal, key)) return exec.journal[key] as never;
      const v = await fn();
      exec.journal[key] = v as JsonValue; // journaled values must be JSON-safe (validated by the optional schema)
      return v;
    },
  });
  const makeMwContext = (step: number, span: SpanRef, emitted: MithrilEvent[]): MiddlewareContext<Deps> => ({
    deps: opts.deps,
    runId,
    step,
    signal,
    runtime: rt,
    journal: (_key, fn) => fn(),
    emit: (e) => {
      emitted.push(stamp(span, { type: e.type, payload: e.payload }));
    },
  });

  const serialize = (step: number, pending: PendingSuspension): string => {
    const token: RunTokenV2 = { v: 2, runId, model: modelId, messages, usage, step, pending };
    return JSON.stringify(token);
  };
  const suspendedResult = (pending: PendingSuspension, step: number): RunResult<JsonValue> => ({
    status: "suspended",
    request: pending.descriptor,
    token: serialize(step, pending),
  });

  // Execute a list of tool calls in order. Yields events; returns a PendingSuspension when a call pauses
  // (approval, Tier-1b return, or Tier-2 mid-tool). `firstDirective` applies to calls[0] only (the resumed one).
  async function* runToolCalls(
    calls: readonly Call[],
    firstDirective: Directive | undefined,
    chatSpan: SpanRef,
    step: number,
  ): AsyncGenerator<MithrilEvent, { readonly suspend?: PendingSuspension }> {
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (call === undefined) continue;
      const directive = i === 0 ? firstDirective : undefined;
      const toolSpan: SpanRef = { id: rt.randomUUID(), parentId: chatSpan.id, traceId, kind: "execute_tool" };
      const tool = opts.tools.find((t) => t.name === call.name);
      if (tool === undefined) {
        yield stamp(toolSpan, { type: "tool.error", callId: call.callId, error: { name: "UnknownTool", message: `No tool "${call.name}"` } });
        messages.push({ role: "tool", content: `error: unknown tool ${call.name}`, toolCalls: [] });
        continue;
      }
      const emitted: MithrilEvent[] = [];

      // ── directive dispatch (calls[0] on resume) ──────────────────────────────────────────────────────
      if (directive === undefined) {
        // Fresh call: gate behind Tier-1 approval if requested.
        const na = tool.needsApproval;
        const ctx = makeCtx(step, toolSpan, emitted);
        const needs = na === undefined ? false : typeof na === "boolean" ? na : await na(call.input as never, ctx);
        for (const e of emitted) yield e;
        emitted.length = 0;
        if (needs) {
          yield stamp(toolSpan, { type: "tool.approval.requested", callId: call.callId, name: call.name, input: call.input });
          const descriptor: SuspensionDescriptor = {
            kind: "tool.approval",
            callId: call.callId,
            payload: { name: call.name, input: call.input },
            resolutionSchemaId: APPROVAL_SCHEMA_ID,
          };
          yield stamp(toolSpan, { type: "suspend", descriptor });
          return { suspend: { kind: "approval", callId: call.callId, descriptor } };
        }
      } else if (directive.kind === "reject") {
        const output: JsonValue = { approved: false, message: directive.message };
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output, ms: 0 });
        messages.push({ role: "tool", content: JSON.stringify(output), toolCalls: [] });
        continue;
      } else if (directive.kind === "return") {
        // Tier-1b: the tool already produced a suspend marker; the resolution IS its result. Do not re-run.
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output: directive.value, ms: 0 });
        messages.push({ role: "tool", content: JSON.stringify(directive.value), toolCalls: [] });
        continue;
      }

      // ── execution (fresh, approved/edited, or Tier-2 replay) ─────────────────────────────────────────
      const exec: ExecState =
        directive?.kind === "midtool"
          ? { journal: { ...directive.journal }, priorResolutions: [...directive.resolutions, directive.value], ordinal: 0 }
          : { journal: {}, priorResolutions: [], ordinal: 0 };
      const rawInput = directive?.kind === "edit" ? directive.input : call.input;
      const started = rt.now();
      const ctx = makeExecCtx(step, toolSpan, emitted, exec);
      const mwCtx = makeMwContext(step, toolSpan, emitted);
      // Core execution as a ToolOutcome; middleware (tool altitude) wraps it and may short-circuit. A
      // suspension (Tier-1b marker or Tier-2 ctx.suspend) unwinds as a SuspendSignal caught below.
      const runCore = async (inv: ToolInvocation): Promise<ToolOutcome> => {
        try {
          const parsed = await validateInput(tool.inputSchema, inv.input);
          const raw = await runExecute(tool, parsed, ctx, (payload) => {
            emitted.push(stamp(toolSpan, { type: "tool.progress", callId: inv.callId, payload }));
          });
          if (isSuspend(raw)) throw new SuspendSignal("return", raw.request, {}, []);
          return { callId: inv.callId, status: "ok", output: raw as JsonValue };
        } catch (err) {
          if (err instanceof SuspendSignal) throw err;
          return { callId: inv.callId, status: "error", error: toSerializedError(err) };
        }
      };
      const chain = middlewares.reduceRight<(inv: ToolInvocation) => Promise<ToolOutcome>>((next, mw) => {
        const wrap = mw.tool;
        return wrap === undefined ? next : (inv) => wrap(mwCtx, inv, next);
      }, runCore);
      const invocation: ToolInvocation = {
        callId: call.callId,
        name: call.name,
        input: rawInput,
        ...(tool.version !== undefined ? { version: tool.version } : {}),
      };
      let outcome: ToolOutcome;
      try {
        outcome = await chain(invocation);
      } catch (err) {
        if (err instanceof SuspendSignal) {
          for (const e of emitted) yield e; // flush any progress/custom events emitted before the pause
          const descriptor = reqToDescriptor(err.request, call.callId);
          yield stamp(toolSpan, { type: "suspend", descriptor });
          const pending: PendingSuspension =
            err.kind === "midtool"
              ? { kind: "midtool", callId: call.callId, descriptor, journal: err.journal, resolutions: err.resolutions }
              : { kind: "return", callId: call.callId, descriptor };
          return { suspend: pending };
        }
        throw err;
      }
      for (const e of emitted) yield e;
      if (outcome.status === "ok") {
        yield stamp(toolSpan, { type: "tool.result", callId: call.callId, output: outcome.output, ms: rt.now() - started });
        messages.push({ role: "tool", content: JSON.stringify(outcome.output), toolCalls: [] });
      } else {
        yield stamp(toolSpan, { type: "tool.error", callId: call.callId, error: outcome.error });
        messages.push({ role: "tool", content: JSON.stringify({ error: outcome.error.message }), toolCalls: [] });
      }
    }
    return {};
  }

  // ── entry: fresh vs resume ────────────────────────────────────────────────────────────────────────
  if (opts.resume === undefined) {
    if (typeof opts.input === "string") messages.push({ role: "user", content: opts.input, toolCalls: [] });
    else for (const m of opts.input) messages.push({ role: m.role, content: m.content, toolCalls: [] });
    const preCtx = makeCtx(-1, rootSpan, []);
    const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
    yield stamp(rootSpan, { type: "run.start", input: inputToJson(opts.input), model: modelId, depsDigest: "" });
    return yield* stepLoop(instructions, 0);
  }

  // ── resume path ───────────────────────────────────────────────────────────────────────────────────
  const resume = opts.resume;
  for (const m of resume.messages) messages.push({ ...m });
  usage = resume.usage;
  const remaining = pendingCalls(messages);
  if (remaining.length === 0 || remaining[0]?.callId !== resume.pending.callId) {
    return { status: "unresumable", request: resume.pending.descriptor, reason: "no matching pending tool call in token" };
  }
  const preCtx = makeCtx(-1, rootSpan, []);
  const instructions = typeof opts.instructions === "string" ? opts.instructions : await opts.instructions(preCtx);
  const resumeSpan: SpanRef = { id: rt.randomUUID(), parentId: rootSpan.id, traceId, kind: "chat" };
  const directive = resumeDirective(resume);
  const resolutionValue: JsonValue = "value" in directive ? directive.value : (directive as JsonValue);
  yield stamp(rootSpan, { type: "resume", resolutionFor: resume.pending.callId, value: resolutionValue });
  const outcome = yield* runToolCalls(remaining, directive, resumeSpan, resume.step);
  if (outcome.suspend !== undefined) return suspendedResult(outcome.suspend, resume.step);
  yield stamp(resumeSpan, { type: "step.finish", step: resume.step, stop: "tool", usage: ZERO_DELTA });
  return yield* stepLoop(instructions, resume.step + 1);

  // Run one step (model call + tool execution) fully, buffering its events into `sink` and returning a
  // structured next-action. The step altitude wraps this whole unit; the model altitude wraps the model call
  // inside it; the tool altitude wraps each tool. `attempt` (structured-output retries) is threaded by ref.
  type StepNext =
    | { readonly kind: "continue" }
    | { readonly kind: "retry" }
    | { readonly kind: "terminal"; readonly result: RunResult<JsonValue>; readonly reason: FinishReason }
    | { readonly kind: "suspend"; readonly pending: PendingSuspension };
  async function runStep(
    step: number,
    instructions: string,
    chatSpan: SpanRef,
    sink: MithrilEvent[],
    attemptRef: { attempt: number },
    maxRetries: number,
    setNext: (n: StepNext) => void,
  ): Promise<StepOutcome> {
    sink.push(stamp(chatSpan, { type: "step.start", step }));
    const system = opts.output !== undefined ? instructions + OUTPUT_HINT : instructions;

    // The model call as a middleware-wrappable unit: streams the provider into the sink + aggregates a
    // ModelResult. Model-altitude middleware can wrap it — retry, cache, or short-circuit.
    const mwCtx = makeMwContext(step, chatSpan, sink);
    const coreModel = async (call: ModelCall): Promise<ModelResult> => {
      const req: ChatRequest = {
        model: call.model,
        system: call.system,
        messages: call.messages,
        tools: call.tools,
        ...(opts.output !== undefined ? { output: opts.output } : {}),
      };
      let text = "";
      let lastPartial = "";
      const calls: Call[] = [];
      let stepUsage: UsageDelta = ZERO_DELTA;
      let finishReason: FinishReason = "stop";
      for await (const chunk of provider.chat(req, rt, transport, signal)) {
        sink.push(stampChunk(stamp, chatSpan, chunk));
        if (chunk.type === "text.delta") {
          text += chunk.delta;
          if (opts.output !== undefined) {
            const partial = tryPartialJson(text);
            if (partial !== undefined) {
              const key = JSON.stringify(partial);
              if (key !== lastPartial) {
                lastPartial = key;
                sink.push(stamp(chatSpan, { type: "object.delta", partial }));
              }
            }
          }
        } else if (chunk.type === "tool.call") calls.push({ callId: chunk.callId, name: chunk.name, input: chunk.input });
        else if (chunk.type === "message.end") {
          stepUsage = chunk.usage;
          finishReason = chunk.finishReason;
        }
      }
      return { text, finishReason, usage: stepUsage, calls };
    };
    const modelChain = middlewares.reduceRight<(c: ModelCall) => Promise<ModelResult>>((next, mw) => {
      const wrap = mw.model;
      return wrap === undefined ? next : (c) => wrap(mwCtx, c, next);
    }, coreModel);

    const result = await modelChain({ model: modelId, system, messages, tools: opts.tools as readonly AnyTool<unknown>[] });
    const calls: Call[] = [...result.calls];
    usage = { ...addUsage(usage, result.usage), steps: usage.steps + 1 };
    messages.push({ role: "assistant", content: result.text, toolCalls: calls });

    if (calls.length === 0) {
      // Structured output: parse the final text as JSON, validate against the schema, retry on failure.
      if (opts.output !== undefined) {
        let value: unknown;
        try {
          value = JSON.parse(result.text);
        } catch {
          value = result.text;
        }
        const validated = await opts.output["~standard"].validate(value);
        if (validated.issues === undefined) {
          sink.push(stamp(chatSpan, { type: "object.final", value: validated.value }));
          sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "output", usage: result.usage }));
          setNext({ kind: "terminal", result: { status: "completed", output: validated.value, usage }, reason: result.finishReason });
          return { step, stop: "output", usage: result.usage };
        }
        sink.push(stamp(chatSpan, { type: "object.invalid", attempt: attemptRef.attempt, issues: issuesToJson(validated.issues) }));
        sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "output", usage: result.usage }));
        if (attemptRef.attempt >= maxRetries) {
          setNext({
            kind: "terminal",
            result: { status: "error", error: { name: "OutputInvalid", message: `structured output failed validation after ${attemptRef.attempt + 1} attempts` }, usage },
            reason: "error",
          });
          return { step, stop: "error", usage: result.usage };
        }
        attemptRef.attempt++;
        messages.push({
          role: "user",
          content: `Your previous response did not match the schema: ${validated.issues.map((i) => i.message).join("; ")}. Reply with ONLY a valid JSON object.`,
          toolCalls: [],
        });
        setNext({ kind: "retry" });
        return { step, stop: "output", usage: result.usage };
      }
      sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "text", usage: result.usage }));
      setNext({ kind: "terminal", result: { status: "completed", output: result.text, usage }, reason: result.finishReason });
      return { step, stop: "text", usage: result.usage };
    }

    // Tools: drain the runToolCalls generator into the sink; a suspension short-circuits the step.
    const toolGen = runToolCalls(calls, undefined, chatSpan, step);
    let toolResult: { readonly suspend?: PendingSuspension } = {};
    for (;;) {
      const r = await toolGen.next();
      if (r.done) {
        toolResult = r.value;
        break;
      }
      sink.push(r.value);
    }
    if (toolResult.suspend !== undefined) {
      setNext({ kind: "suspend", pending: toolResult.suspend });
      return { step, stop: "suspend", usage: result.usage };
    }
    sink.push(stamp(chatSpan, { type: "step.finish", step, stop: "tool", usage: result.usage }));
    setNext({ kind: "continue" });
    return { step, stop: "tool", usage: result.usage };
  }

  // ── the step loop, shared by fresh + resume ─────────────────────────────────────────────────────────
  async function* stepLoop(instructions: string, from: number): AsyncGenerator<MithrilEvent, RunResult<JsonValue>> {
    const maxSteps = opts.maxSteps ?? 16;
    const maxRetries = opts.outputRetries ?? 2;
    const attemptRef = { attempt: 0 };
    for (let step = from; step < maxSteps; step++) {
      if (signal.aborted) {
        yield stamp(rootSpan, { type: "run.cancel", reason: "aborted" });
        return { status: "cancelled", usage };
      }
      const chatSpan: SpanRef = { id: rt.randomUUID(), parentId: rootSpan.id, traceId, kind: "chat" };
      const sink: MithrilEvent[] = [];
      // A holder (not a bare local) so control-flow analysis keeps the full StepNext union across the closure
      // mutation. `next` stays "continue" when a step middleware short-circuits without running the step.
      const holder: { next: StepNext } = { next: { kind: "continue" } };
      const setNext = (n: StepNext): void => {
        holder.next = n;
      };
      const stepCtx = makeMwContext(step, chatSpan, sink);
      const stepChain = middlewares.reduceRight<(i: StepInput) => Promise<StepOutcome>>((run, mw) => {
        const wrap = mw.step;
        return wrap === undefined ? run : (i) => wrap(stepCtx, i, run);
      }, (i) => runStep(i.step, instructions, chatSpan, sink, attemptRef, maxRetries, setNext));

      await stepChain({ step, messages });
      for (const e of sink) yield e;

      const next = holder.next;
      if (next.kind === "suspend") return suspendedResult(next.pending, step);
      if (next.kind === "terminal") {
        yield stamp(rootSpan, { type: "run.finish", reason: next.reason, usage });
        return next.result;
      }
      // "retry" and "continue" both advance to the next step.
    }
    yield stamp(rootSpan, { type: "run.finish", reason: "length", usage });
    return { status: "completed", output: "", usage };
  }
}

// Map the caller-supplied ResumeValue + the token's pending kind onto the internal first-call Directive.
function resumeDirective(resume: ResumeState): Directive {
  const { pending, resolution } = resume;
  if (pending.kind === "approval") {
    if (resolution.kind === "resolve") {
      throw new MithrilError("BAD_RESOLUTION", "This suspension expects an ApprovalDecision (approve/reject/edit), not a resolve value.");
    }
    return resolution;
  }
  if (resolution.kind !== "resolve") {
    throw new MithrilError("BAD_RESOLUTION", "This suspension expects a resolve value ({ kind: 'resolve', value }), not an ApprovalDecision.");
  }
  if (pending.kind === "return") return { kind: "return", value: resolution.value };
  return { kind: "midtool", journal: pending.journal ?? {}, resolutions: pending.resolutions ?? [], value: resolution.value };
}

async function runExecute<Deps>(
  tool: AnyTool<Deps>,
  input: JsonValue,
  ctx: RunContext<Deps>,
  onProgress: (payload: JsonValue) => void,
): Promise<unknown> {
  const ret = tool.execute(input as never, ctx);
  if (isAsyncGen(ret)) {
    const it = ret[Symbol.asyncIterator]();
    for (;;) {
      const r = await it.next();
      if (r.done) return r.value;
      onProgress(r.value.payload);
    }
  }
  return await ret;
}

function stampChunk(stamp: (span: SpanRef, body: EventBody) => MithrilEvent, span: SpanRef, chunk: ProviderChunk): MithrilEvent {
  switch (chunk.type) {
    case "text.delta":
      return stamp(span, { type: "text.delta", delta: chunk.delta });
    case "reasoning.delta":
      return stamp(span, { type: "reasoning.delta", delta: chunk.delta });
    case "tool.input.delta":
      return stamp(span, { type: "tool.input.delta", callId: chunk.callId, name: chunk.name, partial: chunk.partial });
    case "tool.call":
      return stamp(span, { type: "tool.call", callId: chunk.callId, name: chunk.name, input: chunk.input });
    case "object.delta":
      return stamp(span, { type: "object.delta", partial: chunk.partial });
    case "message.end":
      return stamp(span, { type: "message.end", role: "assistant", usage: chunk.usage });
  }
}
