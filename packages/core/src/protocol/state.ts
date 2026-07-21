import type { MithrilEvent } from "./events.ts";
import { addUsage, type JsonValue, type UsageTotals, ZERO_USAGE } from "./primitives.ts";
import type { SuspensionDescriptor } from "./suspension.ts";

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
        if (typeof role === "string" && typeof content === "string") {
          out.push({ role, content, toolCalls: [] });
        }
      }
    }
    return out;
  }
  return [];
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

function setToolOutput(messages: readonly Message[], callId: string, output: JsonValue): readonly Message[] {
  return messages.map((m) => ({
    ...m,
    toolCalls: m.toolCalls.map((tc) => (tc.callId === callId ? { ...tc, output } : tc)),
  }));
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
