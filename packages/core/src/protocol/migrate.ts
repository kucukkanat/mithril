import type { EventType, MithrilEvent } from "./events.ts";

// §4.2 — the union is a DECLARED non-exhaustively-matchable contract. Adding a member is a MINOR; removing
// or reshaping one is a MAJOR. These helpers are what let downstream `switch`es tolerate additive growth.

const KNOWN_TYPES: ReadonlySet<string> = new Set<EventType>([
  "run.start",
  "run.finish",
  "run.error",
  "run.cancel",
  "step.start",
  "step.finish",
  "text.delta",
  "reasoning.delta",
  "tool.input.delta",
  "tool.call",
  "tool.progress",
  "tool.result",
  "tool.error",
  "message.end",
  "object.delta",
  "object.invalid",
  "object.final",
  "usage",
  "compaction",
  "handoff",
  "handoff.result",
  "tool.approval.requested",
  "suspend",
  "resume",
]);

/**
 * Tolerant guard: `true` for any known event member or any `custom.*` type.
 *
 * @param e - The event to classify.
 * @returns Whether `e` is a recognized or custom event.
 *
 * @remarks
 * Deliberately does not `assertNever`, so evolving the (non-exhaustive) union
 * never compile-breaks a consumer that routes unknowns to a default branch.
 */
export function isKnownEvent(e: MithrilEvent): boolean {
  return KNOWN_TYPES.has(e.type) || e.type.startsWith("custom.");
}

/** Thrown by {@link migrate} when an event's protocol MAJOR version is unsupported. */
export class ProtocolVersionError extends Error {
  /** @param found - The unsupported `v` encountered on the event. */
  constructor(readonly found: number) {
    super(`Unsupported protocol version v:${found}; this runtime speaks v:1.`);
    this.name = "ProtocolVersionError";
  }
}

/**
 * Forward-only migration codec for a single event.
 *
 * @param event - An event tagged with a protocol MAJOR `v`.
 * @returns The event unchanged (v1 is identity).
 * @throws {@link ProtocolVersionError} when `v` is not `1` — a newer or unknown
 * MAJOR is refused, never silently coerced.
 */
export function migrate(event: MithrilEvent): MithrilEvent {
  if (event.v !== 1) throw new ProtocolVersionError((event as { v: number }).v);
  return event;
}
