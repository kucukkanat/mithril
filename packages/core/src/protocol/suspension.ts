import type { JsonValue } from "./primitives.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";

// §5.1 — suspension is a first-class VALUE and event, never a thrown interrupt().

/**
 * A request to pause a run until a human (or external system) supplies a
 * validated resolution.
 *
 * @typeParam Kind - The suspension discriminant, e.g. `'tool.approval'`.
 * @typeParam Payload - The JSON-safe data shown to the human/UI.
 * @typeParam Resolution - The type the resume value validates to.
 */
export interface SuspensionRequest<
  Kind extends string = string,
  Payload extends JsonValue = JsonValue,
  Resolution = JsonValue,
> {
  readonly kind: Kind;
  /** JSON-safe data shown to the human/UI. */
  readonly payload: Payload;
  /** Validator for the resume input — resolutions are validated, never trusted. */
  readonly resolutionSchema: StandardSchemaV1<unknown, Resolution>;
  /** Registry id used to re-resolve the validator on open/resume. */
  readonly resolutionSchemaId: string;
}

/** Recover the resolution type of a {@link SuspensionRequest}, or `never`. */
export type ResolutionOf<R> = R extends SuspensionRequest<string, JsonValue, infer T> ? T : never;

/**
 * A human's decision on a tool-approval suspension.
 *
 * @typeParam I - The tool input type, for the `'edit'` variant that overrides it.
 */
export type ApprovalDecision<I> =
  | { readonly kind: "approve" }
  | { readonly kind: "reject"; readonly message: string }
  | { readonly kind: "edit"; readonly input: I };

// The canonical built-in (the 90% HITL case) and the delegation built-in. Both are always implicitly in
// every agent's Susp union (see SuspensionOf).
/** The canonical built-in suspension: request human approval of a pending tool call (the 90% HITL case). */
export type ApprovalRequest = SuspensionRequest<
  "tool.approval",
  { readonly name: string; readonly input: JsonValue },
  ApprovalDecision<JsonValue>
>;

/** The delegation built-in: a run suspends because a child (handed-off) run is itself suspended. */
export type HandoffSuspension = SuspensionRequest<
  "handoff.suspended",
  { readonly to: string; readonly child: SuspensionDescriptor },
  JsonValue
>;

/**
 * A serializable, UI-facing view of what a run is waiting on, carried on the
 * `suspend` event and {@link RunState.pending}.
 *
 * @remarks
 * Declared as a `type` (not `interface`) so it gains an implicit index
 * signature and is assignable to {@link JsonValue} — {@link HandoffSuspension}
 * embeds it as a payload.
 */
export type SuspensionDescriptor = {
  readonly kind: string;
  readonly callId?: string;
  readonly payload: JsonValue;
  readonly resolutionSchemaId: string;
  /** The pending tool's stamped version, checked on resume for drift. */
  readonly toolVersion?: string;
};

/** Unique symbol keying the {@link Suspend} marker returned from a tool's `execute`. */
export const SUSPEND: unique symbol = Symbol("mithril.suspend");

/**
 * The marker value a tool's `execute` returns to request a replay-free mid-tool pause.
 *
 * @typeParam Out - The resolution type fed back as the tool result on resume.
 *
 * @remarks
 * Returning this from a tool (Tier-1b) is not wired in the current runtime slice
 * — the loop rejects it with a `NOT_IMPLEMENTED` error. The value shape is stable.
 */
export interface Suspend<Out> {
  readonly [SUSPEND]: true;
  readonly __out?: Out;
  readonly request: SuspensionRequest;
}

/**
 * Build a {@link Suspend} marker from a {@link SuspensionRequest}.
 *
 * @param req - The suspension request describing what to wait on.
 * @returns A {@link Suspend} marker typed with the request's resolution.
 *
 * @example
 * ```ts
 * return suspend(approvalRequest); // pause execute() until resolved
 * ```
 */
export function suspend<Req extends SuspensionRequest>(req: Req): Suspend<ResolutionOf<Req>> {
  return { [SUSPEND]: true, request: req };
}

/**
 * Type-guard for a {@link Suspend} marker.
 *
 * @param value - Any value.
 * @returns Whether `value` is a {@link Suspend} marker.
 */
export function isSuspend(value: unknown): value is Suspend<unknown> {
  return typeof value === "object" && value !== null && SUSPEND in value;
}

/** Resolves a `resolutionSchemaId` to its Standard Schema for validating a resume resolution. */
export interface SchemaRegistry {
  get(id: string): StandardSchemaV1<unknown, JsonValue> | undefined;
  readonly ids: readonly string[];
}

/**
 * Build a {@link SchemaRegistry} from an id → schema map.
 *
 * @param entries - The `resolutionSchemaId` → validator entries.
 * @returns A registry exposing `get(id)` and the known `ids`.
 */
export function schemaRegistry(
  entries: Readonly<Record<string, StandardSchemaV1<unknown, JsonValue>>>,
): SchemaRegistry {
  const map = new Map<string, StandardSchemaV1<unknown, JsonValue>>(Object.entries(entries));
  return {
    get: (id) => map.get(id),
    ids: Object.keys(entries),
  };
}
