import type { FinishReason, JsonValue, SerializedError, UsageDelta, UsageTotals } from "./primitives.ts";
import type { SuspensionDescriptor } from "./suspension.ts";

// §4 — THE PRODUCT. Monomorphic (`input`/`output` are JsonValue) so the global union never indexes over a
// tool record — the structural defense against type-instantiation collapse. Every event is JSON-safe.

/**
 * Identifies the tracing span an event belongs to, forming the parent/child
 * tree used to route events to their owning (sub-)run.
 */
export interface SpanRef {
  readonly id: string;
  /** Parent span id, or `null` for a root span. */
  readonly parentId: string | null;
  /** Trace id shared by every span in one logical run tree. */
  readonly traceId: string;
  readonly kind: "invoke_agent" | "chat" | "execute_tool" | "workflow" | "handoff";
}

/**
 * The envelope fields present on every {@link MithrilEvent}.
 *
 * @remarks
 * The loop is the single authority for these fields; providers never assign them.
 */
export interface EventMeta {
  /** Protocol MAJOR version; the {@link migrate} codec keys off this. */
  readonly v: 1;
  readonly runId: string;
  /**
   * Monotonic, gap-free sequence number per run. Serves as ordering key,
   * replay cursor, and the basis for gap detection.
   */
  readonly seq: number;
  /** Emission time in epoch milliseconds (from `runtime.now()`). */
  readonly ts: number;
  readonly span: SpanRef;
}

/**
 * The discriminated union of every event on the wire — the core product type.
 *
 * @remarks
 * Discriminated by `type`. Payloads are monomorphic (`input`/`output` are
 * {@link JsonValue}) so the union never indexes over a per-tool record, the
 * structural defence against type-instantiation collapse; per-call input types
 * are recovered on demand via {@link narrow}.
 *
 * The union is deliberately **non-exhaustive**: adding a member is a MINOR
 * version bump, and the trailing `custom.${string}` member is an open escape
 * hatch. Consumers must route unknown `type`s to a default branch rather than
 * `assertNever` — see {@link isKnownEvent}.
 */
export type MithrilEvent =
  // ── lifecycle (spans open/close here) ─────────────────────────────
  | (EventMeta & { readonly type: "run.start"; readonly input: JsonValue; readonly model: string; readonly depsDigest: string })
  | (EventMeta & { readonly type: "run.finish"; readonly reason: FinishReason; readonly usage: UsageTotals })
  | (EventMeta & { readonly type: "run.error"; readonly error: SerializedError })
  | (EventMeta & { readonly type: "run.cancel"; readonly reason: string })
  | (EventMeta & { readonly type: "step.start"; readonly step: number })
  | (EventMeta & { readonly type: "step.finish"; readonly step: number; readonly stop: "tool" | "text" | "output"; readonly usage: UsageDelta })
  // ── assistant message body (streaming) ────────────────────────────
  | (EventMeta & { readonly type: "text.delta"; readonly delta: string })
  | (EventMeta & { readonly type: "reasoning.delta"; readonly delta: string })
  | (EventMeta & { readonly type: "tool.input.delta"; readonly callId: string; readonly name: string; readonly partial: string })
  | (EventMeta & { readonly type: "tool.call"; readonly callId: string; readonly name: string; readonly input: JsonValue; readonly version?: string })
  | (EventMeta & { readonly type: "tool.progress"; readonly callId: string; readonly payload: JsonValue })
  | (EventMeta & { readonly type: "tool.result"; readonly callId: string; readonly output: JsonValue; readonly ms: number })
  | (EventMeta & { readonly type: "tool.error"; readonly callId: string; readonly error: SerializedError })
  | (EventMeta & { readonly type: "message.end"; readonly role: "assistant"; readonly usage: UsageDelta })
  // ── structured output ─────────────────────────────────────────────
  | (EventMeta & { readonly type: "object.delta"; readonly partial: JsonValue })
  | (EventMeta & { readonly type: "object.invalid"; readonly attempt: number; readonly issues: JsonValue })
  | (EventMeta & { readonly type: "object.final"; readonly value: JsonValue })
  // ── accounting / context economics ────────────────────────────────
  | (EventMeta & { readonly type: "usage"; readonly delta: UsageDelta })
  | (EventMeta & { readonly type: "compaction"; readonly removedSeqRange: readonly [number, number]; readonly summarySeq: number; readonly savedTokens: number })
  // ── control flow ──────────────────────────────────────────────────
  | (EventMeta & { readonly type: "handoff"; readonly callId: string; readonly to: string; readonly input: JsonValue })
  | (EventMeta & { readonly type: "handoff.result"; readonly callId: string; readonly to: string; readonly output: JsonValue })
  | (EventMeta & { readonly type: "tool.approval.requested"; readonly callId: string; readonly name: string; readonly input: JsonValue; readonly version?: string })
  | (EventMeta & { readonly type: "suspend"; readonly descriptor: SuspensionDescriptor })
  | (EventMeta & { readonly type: "resume"; readonly resolutionFor: string; readonly value: JsonValue })
  // ── escape hatch ──────────────────────────────────────────────────
  | (EventMeta & { readonly type: `custom.${string}`; readonly payload: JsonValue });

/** The union of every event `type` discriminant. */
export type EventType = MithrilEvent["type"];

/**
 * The specific {@link MithrilEvent} member whose discriminant is `T`.
 *
 * @typeParam T - An {@link EventType} literal, e.g. `'tool.call'`.
 */
export type EventOf<T extends EventType> = Extract<MithrilEvent, { type: T }>;

/**
 * The shape of a `custom.${Id}` event addressed by a specific custom `Id`.
 *
 * @typeParam Id - The custom event id (the suffix after `custom.`).
 * @typeParam P - The payload type; defaults to {@link JsonValue}.
 *
 * @remarks
 * Constructed directly rather than via {@link EventOf} because
 * `Extract<MithrilEvent, { type: 'custom.foo' }>` yields `never` against the
 * `custom.${string}` template member.
 */
export type CustomEventOf<Id extends string, P extends JsonValue = JsonValue> = EventMeta & {
  readonly type: `custom.${Id}`;
  readonly payload: P;
};
