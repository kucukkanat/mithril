import type { ContentPart } from "./content.ts";
import type { MithrilEvent } from "./events.ts";
import { addUsage, type JsonValue, type UsageTotals, ZERO_USAGE } from "./primitives.ts";
import type { SuspensionDescriptor } from "./suspension.ts";
import type { ToolDefinition } from "./tool-registry.ts";

// §4.1 — the reducer / time-travel. State is ALWAYS `replay(log, cursor)`, a pure total fold; never a
// separately-stored mutable checkpoint that can desync.

/** The lifecycle status of a run derived by the reducer. */
export type RunStatus =
  | "running"
  | "suspended"
  | "unresumable"
  | "completed"
  | "cancelled"
  | "error";

/** A single tool call and its (eventual) output within a {@link Message}. */
export interface ToolCallRecord {
  readonly callId: string;
  readonly name: string;
  readonly input: JsonValue;
  /** Present once the corresponding `tool.result` has been reduced. */
  readonly output?: JsonValue;
}

/** One conversation message with any tool calls it issued. */
export interface Message {
  readonly role: string;
  readonly content: string;
  readonly toolCalls: readonly ToolCallRecord[];
}

/**
 * A message at the model-call boundary — like {@link Message}, but `content` may carry multimodal
 * {@link ContentPart}s (images/files) in addition to plain text. The loop threads these to providers; the
 * reducer's {@link Message} keeps a flattened `string` content for state/observability.
 */
export interface ModelMessage {
  readonly role: string;
  readonly content: string | readonly ContentPart[];
  readonly toolCalls: readonly ToolCallRecord[];
}

/**
 * The materialized state of a run — always the pure fold of its event log.
 *
 * @remarks
 * Never stored as an independent mutable checkpoint that could desync; it is
 * always the result of {@link replay} (or a {@link reduce} fold) over the log.
 *
 * @see {@link reduce} and {@link replay}, which produce this from {@link MithrilEvent}s.
 */
export interface RunState {
  readonly runId: string;
  readonly status: RunStatus;
  readonly messages: readonly Message[];
  readonly usage: UsageTotals;
  /** The last applied event `seq`; `-1` before any event is reduced. */
  readonly cursor: number;
  /** The suspension this run is waiting on, when `status` is `'suspended'`. */
  readonly pending?: SuspensionDescriptor;
  /**
   * Tools this run gained after step 0, keyed by name — the fold of `tool.registered`/`tool.revoked`.
   *
   * @remarks
   * Absent (not `{}`) until the first registration. Holds only tools that arrived *during* the run
   * (plugin `setup` and runtime definitions); an agent's statically declared tools are configuration, not
   * log content, and never appear here. Reconstructs which tools existed, not what they returned —
   * outputs come from the recorded `tool.result` events, as for every other tool.
   */
  readonly tools?: Readonly<Record<string, ToolDefinition>>;
  /** Sub-run state keyed by sub-span id. `reduce` routes each event by `span` so a sub-agent's
   *  lifecycle accrues HERE, not into root (closes the span-blind-reducer corruption). */
  readonly subruns?: Readonly<Record<string, RunState>>;
  /** internal bookkeeping for span→owning-run routing; not part of the public contract, always JSON-safe.
   *  `""` = the root run; any other value = the sub-run rooted at that span id. */
  readonly __owners?: Readonly<Record<string, string>>;
}

function freshRun(runId: string): RunState {
  return { runId, status: "running", messages: [], usage: ZERO_USAGE, cursor: -1 };
}

/** The empty seed state: an unstarted `'running'` run with `cursor` at `-1`. Fold start for {@link replay}. */
export const INITIAL: RunState = freshRun("");

function seedMessages(input: JsonValue): readonly Message[] {
  if (typeof input === "string") return [{ role: "user", content: input, toolCalls: [] }];
  if (Array.isArray(input)) {
    const out: Message[] = [];
    for (const m of input) {
      if (m !== null && typeof m === "object" && !Array.isArray(m)) {
        const role = m["role"];
        const content = m["content"];
        if (typeof role !== "string") continue;
        // Multimodal content arrives as a parts array; flatten it to text so the reducer's state stays a
        // readable string (the loop still threads the real parts to the model — see ModelMessage).
        if (typeof content === "string") out.push({ role, content, toolCalls: [] });
        else if (Array.isArray(content)) out.push({ role, content: flattenParts(content), toolCalls: [] });
      }
    }
    return out;
  }
  return [];
}

// Flatten a run-input parts array (JSON, from the run.start event) into a text summary for the reducer state.
function flattenParts(parts: readonly JsonValue[]): string {
  return parts
    .map((p) => {
      if (p === null || typeof p !== "object" || Array.isArray(p)) return "";
      const obj = p as { readonly [k: string]: JsonValue };
      const type = obj["type"];
      const text = obj["text"];
      if (type === "text" && typeof text === "string") return text;
      if (type === "image") return "[image]";
      if (type === "file") return `[file: ${typeof obj["filename"] === "string" ? obj["filename"] : String(obj["mediaType"] ?? "")}]`;
      return "";
    })
    .filter((s) => s !== "")
    .join(" ");
}

function mapLast(messages: readonly Message[], fn: (m: Message) => Message): readonly Message[] {
  const n = messages.length;
  return messages.map((m, i) => (i === n - 1 ? fn(m) : m));
}

function appendAssistantText(messages: readonly Message[], delta: string): readonly Message[] {
  const last = messages[messages.length - 1];
  if (last !== undefined && last.role === "assistant") {
    return mapLast(messages, (m) => ({ ...m, content: m.content + delta }));
  }
  return [...messages, { role: "assistant", content: delta, toolCalls: [] }];
}

function addToolCall(messages: readonly Message[], rec: ToolCallRecord): readonly Message[] {
  const last = messages[messages.length - 1];
  if (last !== undefined && last.role === "assistant") {
    return mapLast(messages, (m) => ({ ...m, toolCalls: [...m.toolCalls, rec] }));
  }
  return [...messages, { role: "assistant", content: "", toolCalls: [rec] }];
}

// Bind the result to the MOST RECENT call bearing this id, not every one of them. Several providers mint
// call ids from a counter that restarts each request (`call_0`, `call_1`, …), so ids are unique within a
// step but repeat across steps; matching globally would let step 2's result overwrite step 1's record.
function setToolOutput(messages: readonly Message[], callId: string, output: JsonValue): readonly Message[] {
  const mi = messages.findLastIndex((m) => m.toolCalls.some((tc) => tc.callId === callId));
  if (mi === -1) return messages;
  const target = messages[mi];
  if (target === undefined) return messages;
  const ci = target.toolCalls.findLastIndex((tc) => tc.callId === callId);
  return messages.map((m, i) => (i === mi ? { ...m, toolCalls: m.toolCalls.map((tc, j) => (j === ci ? { ...tc, output } : tc)) } : m));
}

function withoutPending(run: RunState, status: RunStatus): RunState {
  const { pending: _omit, ...rest } = run;
  return { ...rest, status };
}

// Apply ONE event's effect to a single run (root or sub-run). Total: an unrecognized `type` is inert.
function applyToRun(run: RunState, e: MithrilEvent): RunState {
  switch (e.type) {
    case "run.start":
      return { ...run, runId: e.runId, status: "running", messages: seedMessages(e.input) };
    case "step.start":
      return { ...run, messages: [...run.messages, { role: "assistant", content: "", toolCalls: [] }] };
    case "text.delta":
    case "reasoning.delta":
      return { ...run, messages: appendAssistantText(run.messages, e.delta) };
    case "tool.call":
      return {
        ...run,
        messages: addToolCall(run.messages, { callId: e.callId, name: e.name, input: e.input }),
      };
    case "tool.result":
      return { ...run, messages: setToolOutput(run.messages, e.callId, e.output) };
    case "usage":
      return { ...run, usage: addUsage(run.usage, e.delta) };
    case "step.finish":
      return { ...run, usage: { ...addUsage(run.usage, e.usage), steps: run.usage.steps + 1 } };
    case "run.finish":
      return { ...run, status: "completed", usage: e.usage };
    case "run.error":
      return { ...run, status: "error" };
    case "run.cancel":
      return { ...run, status: "cancelled" };
    case "suspend":
      return { ...run, status: "suspended", pending: e.descriptor };
    case "resume":
      return withoutPending(run, "running");
    case "tool.registered":
      return { ...run, tools: { ...(run.tools ?? {}), [e.name]: e.definition } };
    case "tool.revoked": {
      if (run.tools === undefined || !Object.hasOwn(run.tools, e.name)) return run;
      const { [e.name]: _removed, ...rest } = run.tools;
      return { ...run, tools: rest };
    }
    default:
      // tool.input.delta, tool.progress, tool.error, message.end, object.*, compaction, handoff*,
      // tool.approval.requested, custom.*, and any future additive member: inert (state = the log).
      return run;
  }
}

/**
 * Apply one {@link MithrilEvent} to a {@link RunState}, returning the next state.
 *
 * @param state - The current run state (start from {@link INITIAL}).
 * @param e - The next event to fold in.
 * @returns A new {@link RunState}; the input is never mutated.
 *
 * @remarks
 * Pure and total — an unrecognized `type` is inert (state stays the log). The
 * event is routed to its owning run via the `span` tree: a sub-run is opened by
 * a `run.start` whose span has a non-null `parentId`, and its lifecycle accrues
 * under {@link RunState.subruns} rather than the root. Arbitrary nesting
 * resolves in a single forward pass because a span always opens before events
 * reference it (`seq` is monotonic).
 *
 * @example
 * ```ts
 * const next = reduce(INITIAL, event);
 * const state = log.reduce(reduce, INITIAL); // == replay(log)
 * ```
 */
export function reduce(state: RunState, e: MithrilEvent): RunState {
  const owners: Record<string, string> = { ...(state.__owners ?? {}) };
  const spanId = e.span.id;
  const parentId = e.span.parentId;

  let owner: string;
  if (e.type === "run.start" && parentId !== null) {
    owner = spanId; // this event opens a sub-run rooted at its own span
    owners[spanId] = owner;
  } else if (Object.hasOwn(owners, spanId)) {
    owner = owners[spanId] ?? "";
  } else {
    owner = (parentId !== null ? owners[parentId] : undefined) ?? "";
    owners[spanId] = owner; // memoize so descendants inherit
  }

  const cursor = e.seq;
  if (owner === "") {
    return { ...applyToRun(state, e), cursor, __owners: owners };
  }

  const subruns: Record<string, RunState> = { ...(state.subruns ?? {}) };
  const current = subruns[owner] ?? freshRun(e.runId);
  subruns[owner] = { ...applyToRun(current, e), cursor };
  return { ...state, cursor, subruns, __owners: owners };
}

/**
 * Fold an event log into a {@link RunState}, optionally up to a cursor (time-travel).
 *
 * @param log - The ordered event log to replay.
 * @param toSeq - Inclusive upper bound on `seq`; omit for the final state.
 * @returns The {@link RunState} after reducing every included event over {@link INITIAL}.
 *
 * @example
 * ```ts
 * const final = replay(log);          // full state
 * const at5 = replay(log, 5);         // state as of seq <= 5
 * ```
 */
export function replay(log: readonly MithrilEvent[], toSeq?: number): RunState {
  const events = toSeq === undefined ? log : log.filter((e) => e.seq <= toSeq);
  return events.reduce(reduce, INITIAL);
}
