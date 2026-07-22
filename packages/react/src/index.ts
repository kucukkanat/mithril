/**
 * Headless React bindings for Mithril runs — hooks and a framework-agnostic store, no components.
 *
 * @remarks
 * This entrypoint holds the DOM-free {@link createRunStore} (a `subscribe`/`getSnapshot` store),
 * so `@mithril/react` itself needs no React peer. The actual hooks — {@link useRun}, {@link useObject} —
 * live in `@mithril/react/hooks`, which declares the `react >=18` peer dependency.
 *
 * @packageDocumentation
 */

import { type MithrilEvent, replay, type RunState } from "@mithril/core/protocol";

// The framework-agnostic core of the React bindings: a subscribe/getSnapshot store over an event source
// (a RunHandle or any AsyncIterable<MithrilEvent>). `useRun` is a one-line useSyncExternalStore wrapper over
// this (below) — the store holds all the logic, so it is tested without a DOM.

/**
 * An immutable view of a run, recomputed on every event.
 *
 * @remarks
 * Shape: `{ state, text, status, events, costUsd }`.
 */
export interface RunSnapshot {
  /** The full replayed {@link RunState} for the events seen so far. */
  readonly state: RunState;
  /** All `text.delta` chunks concatenated into the running output string. */
  readonly text: string;
  /** `"streaming"` while events are still arriving; otherwise the terminal {@link RunState.status}. */
  readonly status: RunState["status"] | "streaming";
  /** Every event received so far, in order. */
  readonly events: readonly MithrilEvent[];
  /** Accumulated cost in US dollars (derived from `state.usage.costMicroUsd`). */
  readonly costUsd: number;
}

/** A `useSyncExternalStore`-compatible store over a run's events. Created by {@link createRunStore}. */
export interface RunStore {
  /** Register a change listener; returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void;
  /** Return the current {@link RunSnapshot} (a stable reference between changes). */
  getSnapshot(): RunSnapshot;
}

/**
 * The snapshot for a component with no run yet — an empty transcript. Returned by {@link useRun} when its
 * source is `undefined`, so a component can call the hook unconditionally before a run has started.
 */
export const IDLE_SNAPSHOT: RunSnapshot = { state: replay([]), text: "", status: "streaming", events: [], costUsd: 0 };

/** A stable, inert {@link RunStore} that always reports {@link IDLE_SNAPSHOT} (used when no run is active). */
export function idleRunStore(): RunStore {
  return {
    subscribe: () => () => {},
    getSnapshot: () => IDLE_SNAPSHOT,
  };
}

/**
 * Build a framework-agnostic {@link RunStore} that folds an event stream into a live {@link RunSnapshot}.
 *
 * @remarks
 * Immediately begins consuming `source`, recomputing the snapshot and notifying subscribers on each event;
 * `status` flips off `"streaming"` once the stream ends. This is the DOM-free core that {@link useRun}
 * wraps — pass the `.events` iterable directly (e.g. `createRunStore(handle.events)`).
 *
 * @param source - The run's event stream (e.g. a `RunHandle`'s `.events`).
 * @returns A store exposing `subscribe` and `getSnapshot`.
 */
export function createRunStore(source: AsyncIterable<MithrilEvent>): RunStore {
  const events: MithrilEvent[] = [];
  let snapshot: RunSnapshot = IDLE_SNAPSHOT;
  let ended = false;
  const subs = new Set<() => void>();

  const recompute = (): void => {
    const state = replay(events);
    const text = events.flatMap((e) => (e.type === "text.delta" ? [e.delta] : [])).join("");
    snapshot = {
      state,
      text,
      status: ended ? state.status : "streaming",
      events: [...events],
      costUsd: state.usage.costMicroUsd / 1e6,
    };
    for (const s of subs) s();
  };

  void (async () => {
    for await (const e of source) {
      events.push(e);
      recompute();
    }
    ended = true;
    recompute();
  })();

  return {
    subscribe(onChange) {
      subs.add(onChange);
      return () => {
        subs.delete(onChange);
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };
}

// ── chat store (multi-turn) ────────────────────────────────────────────────────────────────────────────

/** A single chat turn — structurally an `InputMessage`, so the history feeds straight back into a run. */
export interface ChatMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** An immutable view of a chat: completed `messages`, the in-flight assistant `streaming` text, and `status`. */
export interface ChatSnapshot {
  readonly messages: readonly ChatMessage[];
  readonly streaming: string;
  readonly status: "idle" | "streaming" | "error";
}

/** The minimal agent shape {@link createChatStore} needs: `stream(history)` yielding a run's events. */
export interface ChatAgent {
  stream(input: readonly ChatMessage[]): { readonly events: AsyncIterable<MithrilEvent> };
}

/** A `useSyncExternalStore`-compatible chat store with a `send` action. Created by {@link createChatStore}. */
export interface ChatStore {
  subscribe(onChange: () => void): () => void;
  getSnapshot(): ChatSnapshot;
  /** Append a user message and stream the assistant's reply, accumulating history. Ignored mid-stream. */
  send(input: string): void;
}

const IDLE_CHAT: ChatSnapshot = { messages: [], streaming: "", status: "idle" };

/**
 * Build a framework-agnostic multi-turn {@link ChatStore} over an agent — the DOM-free core that
 * {@link useChat} wraps, so the conversation logic is tested without React.
 *
 * @remarks On `send`, appends the user message, streams `agent.stream(history)` while accumulating the
 * assistant's `text.delta`s into `streaming`, then commits the assistant turn to `messages`. Concurrent
 * `send`s while a reply is streaming are ignored. A `run.error` (or a thrown stream) settles `status: "error"`.
 * @param agent - the agent to converse with (a Mithril `Agent` satisfies {@link ChatAgent}).
 * @returns a store exposing `subscribe`, `getSnapshot`, and `send`.
 */
export function createChatStore(agent: ChatAgent): ChatStore {
  let snapshot: ChatSnapshot = IDLE_CHAT;
  const subs = new Set<() => void>();
  const set = (next: ChatSnapshot): void => {
    snapshot = next;
    for (const s of subs) s();
  };
  return {
    subscribe(onChange) {
      subs.add(onChange);
      return () => {
        subs.delete(onChange);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    send(input) {
      if (snapshot.status === "streaming") return;
      const messages = [...snapshot.messages, { role: "user" as const, content: input }];
      set({ messages, streaming: "", status: "streaming" });
      void (async () => {
        let text = "";
        let errored = false;
        try {
          for await (const e of agent.stream(messages).events) {
            if (e.type === "text.delta") {
              text += e.delta;
              set({ messages, streaming: text, status: "streaming" });
            } else if (e.type === "run.error") {
              errored = true;
            }
          }
        } catch {
          errored = true;
        }
        set({
          messages: [...messages, { role: "assistant", content: text }],
          streaming: "",
          status: errored ? "error" : "idle",
        });
      })();
    },
  };
}

// useRun(handle) in a React app is exactly:
//   const store = useMemo(() => createRunStore(handle.events), [handle]);
//   return useSyncExternalStore(store.subscribe, store.getSnapshot);
// (kept out of this file so the package type-checks without the react peer in this environment.)
