/**
 * React hooks for subscribing components to Mithril runs — {@link useRun} and {@link useObject}.
 *
 * @remarks
 * Thin `useSyncExternalStore` wrappers over the framework-agnostic store from `@mithril/react`. This
 * entrypoint (`@mithril/react/hooks`) declares the `react >=18` peer dependency.
 *
 * @packageDocumentation
 */

import { useMemo, useSyncExternalStore } from "react";
import type { JsonValue, MithrilEvent } from "@mithril/core/protocol";
import { type ChatAgent, type ChatSnapshot, createChatStore, createRunStore, idleRunStore, type RunSnapshot } from "./index.ts";

// The actual React hooks — thin useSyncExternalStore wrappers over the (framework-agnostic, tested) store.
// Kept in a separate entrypoint (`@mithril/react/hooks`) so `@mithril/react` itself needs no react peer.

/**
 * Anything carrying a run event stream — notably a `RunHandle`, which satisfies this shape.
 *
 * @remarks
 * Accepted by {@link useRun} and {@link useObject}; typically `agent.stream(input)`.
 */
export interface RunSource {
  /** The run's event stream. */
  readonly events: AsyncIterable<MithrilEvent>;
}

/**
 * Subscribe a component to a streaming run and re-render as events arrive.
 *
 * @param source - A {@link RunSource}, e.g. `agent.stream(input)`, or `undefined` before a run has started
 * (the hook then reports an empty idle snapshot, so it can be called unconditionally per the rules of hooks).
 * @returns The current {@link RunSnapshot}, updated on each event.
 * @remarks Memoizes the store on `source` identity; pass a stable handle to avoid re-subscribing every render.
 * @example
 * ```tsx
 * function Chat({ run }: { run: RunSource | undefined }) {
 *   const { text, status, costUsd } = useRun(run); // safe before the first run: run === undefined
 *   return <pre>{text}{status === "streaming" ? "▍" : ` — $${costUsd.toFixed(4)}`}</pre>;
 * }
 * ```
 */
export function useRun(source: RunSource | undefined): RunSnapshot {
  const store = useMemo(() => (source === undefined ? idleRunStore() : createRunStore(source.events)), [source]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/**
 * Track a run's structured output as it streams.
 *
 * @param source - A {@link RunSource} whose run emits `object.delta` / `object.final` events.
 * @returns `{ partial, value }` — `partial` is the latest in-flight object (from `object.delta`),
 * `value` is the finalized object (from `object.final`); each is `undefined` until seen.
 */
/** The value returned by {@link useChat}: the current {@link ChatSnapshot} plus a `send` action. */
export interface UseChatResult extends ChatSnapshot {
  /** Append a user message and stream the assistant's reply. Ignored while a reply is streaming. */
  send(input: string): void;
}

/**
 * Subscribe a component to a multi-turn conversation with an agent — the industry-standard chat hook.
 *
 * @param agent - the agent to converse with (any Mithril `Agent` satisfies {@link ChatAgent}).
 * @returns `{ messages, streaming, status, send }` — call `send(text)` to add a user turn and stream the reply.
 * @remarks A thin {@link useSyncExternalStore} wrapper over {@link createChatStore} (which holds the tested,
 * DOM-free logic). Memoizes the store on `agent` identity; pass a stable agent to preserve history across renders.
 * @example
 * ```tsx
 * function Chat({ assistant }: { assistant: Agent<[], void> }) {
 *   const { messages, streaming, status, send } = useChat(assistant);
 *   return (
 *     <>
 *       {messages.map((m, i) => <p key={i}><b>{m.role}:</b> {m.content}</p>)}
 *       {streaming && <p><b>assistant:</b> {streaming}▍</p>}
 *       <button disabled={status === "streaming"} onClick={() => send("Weather in NYC?")}>Ask</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useChat(agent: ChatAgent): UseChatResult {
  const store = useMemo(() => createChatStore(agent), [agent]);
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...snap, send: store.send };
}

export function useObject(source: RunSource | undefined): { readonly partial: JsonValue | undefined; readonly value: JsonValue | undefined } {
  const snap = useRun(source);
  let partial: JsonValue | undefined;
  let value: JsonValue | undefined;
  for (const e of snap.events) {
    if (e.type === "object.delta") partial = e.partial;
    if (e.type === "object.final") value = e.value;
  }
  return { partial, value };
}
