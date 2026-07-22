/**
 * Turn a Mithril event stream into OpenTelemetry GenAI (`gen_ai.*`) spans — dependency-free.
 *
 * @remarks
 * Reconstructs the `invoke_agent > chat > execute_tool` span hierarchy directly off the wire, with
 * no dependency on `@opentelemetry/api`. A real OTel exporter is a thin adapter over the
 * {@link SpanSink} interface. See {@link toGenAiSpans}.
 *
 * @packageDocumentation
 */

import type { EventConsumer, MithrilEvent, Plugin } from "@mithril/core/protocol";

// §9.3 — build the gen_ai.* span hierarchy directly off the wire: invoke_agent > chat > execute_tool. This
// is a dependency-free shape (a real @opentelemetry/api sink is a thin adapter over onSpan). Metadata is on
// by default; content (prompts/outputs) is opt-in. Spans are reconstructed by grouping events on span.id.

/**
 * A reconstructed OpenTelemetry GenAI span, following the `gen_ai.*` semantic conventions.
 *
 * @remarks
 * Spans are built by grouping events on `span.id`; `startTime`/`endTime` are the first and last event
 * timestamps for that span.
 */
export interface GenAiSpan {
  /** The span's own id (the source event's `span.id`). */
  readonly spanId: string;
  /** The parent span's id, or `null` for a root span. */
  readonly parentSpanId: string | null;
  /** The trace this span belongs to. */
  readonly traceId: string;
  /** Display name; starts as the {@link GenAiSpan.kind} and becomes `execute_tool <tool>` once the tool is known. */
  name: string; // "invoke_agent" | "chat" | "execute_tool <tool>"
  /** The GenAI operation this span represents. */
  readonly kind: "invoke_agent" | "chat" | "execute_tool" | "workflow" | "handoff";
  /** Start timestamp (epoch ms) — the first event seen for this span. */
  readonly startTime: number;
  /** End timestamp (epoch ms) — the last event seen for this span; `undefined` until the span sees a second event. */
  endTime?: number;
  /** `gen_ai.*` attributes (model, tool name, output tokens, span kind, …). */
  readonly attributes: Record<string, string | number | boolean>;
}

/** Receiver for reconstructed spans — implement this to bridge {@link toGenAiSpans} to a real OTel exporter. */
export interface SpanSink {
  /** Called once per completed span, in creation order. */
  onSpan(span: GenAiSpan): void;
}

/**
 * Reconstruct {@link GenAiSpan}s from a Mithril event stream, optionally forwarding them to a {@link SpanSink}.
 *
 * @remarks
 * Metadata attributes (model, output tokens, tool name) are always captured. Content — prompt/tool
 * inputs — is opt-in via `opts.captureContent` and defaults to off.
 *
 * @param events - The events to fold into spans (grouped by `span.id`).
 * @param sink - Optional sink; when provided, every span is passed to {@link SpanSink.onSpan} after folding.
 * @param opts - Options; set `captureContent: true` to record tool input payloads.
 * @returns All reconstructed spans, in creation order.
 * @example
 * ```ts
 * import { toGenAiSpans } from "@mithril/otel";
 *
 * const spans = toGenAiSpans(run.events, { onSpan: (s) => exporter.export(s) });
 * // or collect without a sink:
 * const collected = toGenAiSpans(run.events);
 * ```
 */
export function toGenAiSpans(
  events: Iterable<MithrilEvent>,
  sink?: SpanSink,
  opts?: { readonly captureContent?: boolean },
): readonly GenAiSpan[] {
  const capture = opts?.captureContent ?? false;
  const byId = new Map<string, GenAiSpan>();
  const all: GenAiSpan[] = [];
  const toolNameByCallId = new Map<string, string>();

  for (const e of events) {
    if (e.type === "tool.call") {
      toolNameByCallId.set(e.callId, e.name);
      if (capture) toolNameByCallId.set(`${e.callId}:input`, JSON.stringify(e.input));
    }
    let span = byId.get(e.span.id);
    if (span === undefined) {
      span = {
        spanId: e.span.id,
        parentSpanId: e.span.parentId,
        traceId: e.span.traceId,
        kind: e.span.kind,
        name: e.span.kind,
        startTime: e.ts,
        attributes: { "gen_ai.span.kind": e.span.kind },
      };
      byId.set(e.span.id, span);
      all.push(span);
    }
    span.endTime = e.ts;
    if (e.type === "run.start") span.attributes["gen_ai.request.model"] = e.model;
    if (e.type === "run.finish") span.attributes["gen_ai.usage.output_tokens"] = e.usage.output;
    if (e.type === "tool.result" || e.type === "tool.error") {
      const name = toolNameByCallId.get(e.callId);
      if (name !== undefined) {
        span.name = `execute_tool ${name}`;
        span.attributes["gen_ai.tool.name"] = name;
      }
    }
  }

  if (sink !== undefined) for (const s of all) sink.onSpan(s);
  return all;
}

/**
 * A {@link Plugin} that emits {@link GenAiSpan}s to `sink` as runs complete — the live counterpart to
 * {@link toGenAiSpans}, so tracing is `use: [otelPlugin(exporter)]` instead of manually buffering a run's
 * events and folding them yourself.
 *
 * @param sink - the {@link SpanSink} each run's reconstructed spans are forwarded to.
 * @param opts - options; set `captureContent: true` to record tool input payloads.
 * @returns a plugin whose event consumer buffers each run (keyed by `traceId`) and folds it to spans on the
 * terminal `run.finish` / `run.error` / `run.cancel` event.
 * @remarks Spans flush at run completion (not incrementally), so a run that suspends without finishing does
 * not emit until it resumes and completes. Add to any agent via `AgentConfig`'s `use` array.
 * @example
 * ```ts
 * import { otelPlugin } from "@mithril/otel";
 *
 * const a = agent({ model, instructions: "…", use: [otelPlugin({ onSpan: (s) => exporter.export(s) })] });
 * ```
 */
export function otelPlugin(sink: SpanSink, opts?: { readonly captureContent?: boolean }): Plugin {
  const buffers = new Map<string, MithrilEvent[]>();
  const consumer: EventConsumer = {
    name: "otel",
    onEvent(e) {
      const key = e.span.traceId;
      const buf = buffers.get(key) ?? [];
      buf.push(e);
      buffers.set(key, buf);
      if (e.type === "run.finish" || e.type === "run.error" || e.type === "run.cancel") {
        buffers.delete(key);
        toGenAiSpans(buf, sink, opts);
      }
    },
  };
  return { name: "otel", consumers: [consumer] };
}
