import type { MithrilEvent, RunState, SpanRef } from "@mithril/core/protocol";

// Pure, DOM-free derivations over a run's event log — the data a visual inspector renders. Kept here (not in
// the React layer) so they are unit-testable with bun and reusable by any UI. Everything folds from the same
// event stream the loop emits; nothing reaches into the loop.

// ── event classification + preview (the single home; the docs playground imports these) ─────────────────

/** Colour-coded families the {@link MithrilEvent} union groups into for an inspector row. */
export type EventKind = "lifecycle" | "text" | "tool" | "toolResult" | "object" | "control" | "meta" | "error" | "custom";

/**
 * Classify an event `type` into a colour-coded {@link EventKind} family for the inspector.
 *
 * @param type - a {@link MithrilEvent} discriminant (or any string; unknown/`custom.*` map sensibly).
 * @returns the family used to colour the event's row.
 */
export function classifyEvent(type: string): EventKind {
  if (type.startsWith("custom.")) return "custom";
  if (type === "tool.error" || type === "run.error" || type === "object.invalid") return "error";
  if (type === "tool.result") return "toolResult";
  if (type.startsWith("tool.")) return "tool";
  if (type.startsWith("object.")) return "object";
  if (type === "text.delta" || type === "reasoning.delta" || type === "message.end") return "text";
  if (type === "suspend" || type === "resume" || type.startsWith("handoff")) return "control";
  if (type === "usage" || type === "compaction") return "meta";
  return "lifecycle"; // run.* and step.*
}

function compact(v: unknown): string {
  if (v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 90 ? `${s.slice(0, 89)}…` : s;
}

/**
 * A short, human-friendly one-line preview of an event's payload, for an inspector row.
 *
 * @param e - the event to preview.
 * @returns a compact string (≤90 chars), or `""` when there is nothing useful to show.
 */
export function previewEvent(e: MithrilEvent): string {
  const r = e as unknown as Record<string, unknown>;
  switch (e.type) {
    case "text.delta":
    case "reasoning.delta":
      return compact(r["delta"]);
    case "tool.call":
      return `${String(r["name"])}(${compact(r["input"])})`;
    case "tool.result":
      return compact(r["output"]);
    case "tool.error":
      return compact(r["error"]);
    case "message.end": {
      const u = r["usage"] as { input?: number; output?: number } | undefined;
      const tok = (u?.input ?? 0) + (u?.output ?? 0);
      return `${String(r["role"] ?? "assistant")} · ${tok} tok`;
    }
    case "object.delta":
      return compact(r["partial"]);
    case "object.final":
      return compact(r["value"]);
    case "tool.approval.requested":
      return compact(r["name"]);
    case "suspend":
      return compact((r["descriptor"] as { kind?: unknown } | undefined)?.kind);
    default:
      if (e.type.startsWith("custom.")) return compact(r["payload"]);
      return "";
  }
}

// ── span tree (invoke_agent → chat → execute_tool → handoff, incl. nested sub-runs) ─────────────────────

/** A node in the span tree: one span, the events stamped to it, and its child spans. */
export interface SpanNode {
  readonly span: SpanRef;
  readonly events: readonly MithrilEvent[];
  readonly children: readonly SpanNode[];
}

interface MutableSpanNode {
  readonly span: SpanRef;
  readonly events: MithrilEvent[];
  readonly children: MutableSpanNode[];
}

/**
 * Group a run's events into a tree of spans by their `span.parentId`.
 *
 * @param events - the run's event log (in `seq` order).
 * @returns the root {@link SpanNode}s (spans with no parent, or whose parent is absent from the log), each
 * carrying its own events and nested child spans — so nested `asTool`/handoff sub-runs render as sub-trees.
 * @remarks Pure: the tree is derived entirely from `e.span`. First-seen order is preserved among siblings.
 */
export function buildSpanTree(events: readonly MithrilEvent[]): readonly SpanNode[] {
  const nodes = new Map<string, MutableSpanNode>();
  const order: string[] = [];
  for (const e of events) {
    let node = nodes.get(e.span.id);
    if (node === undefined) {
      node = { span: e.span, events: [], children: [] };
      nodes.set(e.span.id, node);
      order.push(e.span.id);
    }
    node.events.push(e);
  }
  const roots: MutableSpanNode[] = [];
  for (const id of order) {
    const node = nodes.get(id);
    if (node === undefined) continue;
    const parent = node.span.parentId !== null ? nodes.get(node.span.parentId) : undefined;
    if (parent !== undefined) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

// ── cost + context meters (read straight off usage/compaction — no side channel) ────────────────────────

/** A projection of a run's accounting for the inspector's cost/context meters. */
export interface ContextMeter {
  /** Total billed tokens so far (`input + output + cacheRead + cacheWrite + reasoning`). */
  readonly tokens: number;
  /** Accumulated cost in USD (`usage.costMicroUsd / 1e6`). */
  readonly cost: number;
  readonly steps: number;
  /** The model's context window, when supplied — enables the fill bar. */
  readonly contextWindow?: number;
  /** `tokens / contextWindow * 100`, when `contextWindow` is supplied. */
  readonly pct?: number;
}

/**
 * Project a {@link RunState}'s usage into a {@link ContextMeter} for the cost/context display.
 *
 * @param state - the run state (`replay(log)` of the events so far).
 * @param opts - `contextWindow` (model max tokens) enables the fill percentage/bar.
 * @returns tokens, cost, steps, and — when `contextWindow` is given — the fill `pct`.
 */
export function contextMeter(state: RunState, opts?: { readonly contextWindow?: number }): ContextMeter {
  const u = state.usage;
  const tokens = u.input + u.output + u.cacheRead + u.cacheWrite + u.reasoning;
  const cw = opts?.contextWindow;
  return {
    tokens,
    cost: u.costMicroUsd / 1e6,
    steps: u.steps,
    ...(cw !== undefined ? { contextWindow: cw, pct: cw > 0 ? (tokens / cw) * 100 : 0 } : {}),
  };
}

/**
 * Sum the tokens reclaimed by `compaction` events in a log.
 *
 * @param events - the run's event log.
 * @returns the total `savedTokens` across every `compaction` event (0 if none).
 */
export function compactionSavings(events: readonly MithrilEvent[]): number {
  let saved = 0;
  for (const e of events) if (e.type === "compaction") saved += e.savedTokens;
  return saved;
}
