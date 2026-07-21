/**
 * Headless run inspector for Mithril — captures the event stream of one or more runs and exposes their
 * replayed state, raw log, and a compact timeline. This is the data core a visual devtools UI renders; it is
 * a pure {@link EventConsumer}, so it works in any runtime (Node, Bun, browser).
 *
 * @packageDocumentation
 */

import type { EventConsumer, MithrilEvent, Plugin, RunState } from "@mithril/core/protocol";
import { replay } from "@mithril/core/protocol";

// Pure, DOM-free selectors over the event log — the data a visual UI renders. Re-exported so `@mithril/devtools`
// is the single home for both the headless inspector and its derivations (the React layer lives at `./ui`).
export type { ContextMeter, EventKind, SpanNode } from "./selectors.ts";
export { buildSpanTree, classifyEvent, compactionSavings, contextMeter, previewEvent } from "./selectors.ts";

// A run's events are the product; the inspector is a pure consumer that buffers them per run and derives
// everything else (state via replay, a timeline projection) on demand. No private channel into the loop — it
// sees exactly what any consumer sees. A visual UI (the browser inspector) renders this; that UI is roadmap.

/** One row of a run's timeline: the event's sequence, timestamp, `type`, and owning span id. */
export interface TimelineEntry {
  readonly seq: number;
  readonly ts: number;
  readonly type: string;
  readonly span: string;
}

/** A captured run: its id, ordered event log, replayed {@link RunState}, and {@link TimelineEntry} projection. */
export interface InspectedRun {
  readonly runId: string;
  readonly events: readonly MithrilEvent[];
  readonly state: RunState;
  readonly timeline: readonly TimelineEntry[];
}

/**
 * A headless run inspector.
 *
 * @remarks Add {@link Inspector.consumer} to an agent (via `use:` or `agentLoop`'s `consumers`) and it
 * records every run. Everything else is derived on read.
 */
export interface Inspector {
  /** The {@link EventConsumer} to attach to an agent; records every event it sees. */
  readonly consumer: EventConsumer;
  /** The ids of currently-retained runs, oldest first. */
  runIds(): readonly string[];
  /** The captured run for `runId`, or `undefined` if unknown/evicted. */
  get(runId: string): InspectedRun | undefined;
  /** The most recently started run, or `undefined` if none. */
  latest(): InspectedRun | undefined;
  /** Drop all retained runs. */
  clear(): void;
}

/**
 * Create a headless {@link Inspector} that captures runs from the event stream.
 *
 * @param opts - `maxRuns` caps retained runs (default 50); the oldest is evicted past the cap.
 * @returns an {@link Inspector}; attach its `consumer` to an agent.
 * @example
 * ```ts
 * import { createInspector } from "@mithril/devtools";
 *
 * const inspector = createInspector();
 * await agent({ model, instructions: "…", use: [{ name: "dev", consumers: [inspector.consumer] }] }).run("hi");
 * console.log(inspector.latest()?.state.status, inspector.latest()?.timeline);
 * ```
 */
export function createInspector(opts?: { readonly maxRuns?: number }): Inspector {
  const maxRuns = opts?.maxRuns ?? 50;
  const order: string[] = [];
  const buffers = new Map<string, MithrilEvent[]>();

  const build = (runId: string): InspectedRun | undefined => {
    const events = buffers.get(runId);
    if (events === undefined) return undefined;
    return {
      runId,
      events,
      state: replay(events),
      timeline: events.map((e) => ({ seq: e.seq, ts: e.ts, type: e.type, span: e.span.id })),
    };
  };

  return {
    consumer: {
      name: "mithril.devtools.inspector",
      onEvent(e: MithrilEvent): void {
        let buf = buffers.get(e.runId);
        if (buf === undefined) {
          buf = [];
          buffers.set(e.runId, buf);
          order.push(e.runId);
          while (order.length > maxRuns) {
            const evicted = order.shift();
            if (evicted !== undefined) buffers.delete(evicted);
          }
        }
        buf.push(e);
      },
    },
    runIds() {
      return [...order];
    },
    get(runId) {
      return build(runId);
    },
    latest() {
      const id = order[order.length - 1];
      return id !== undefined ? build(id) : undefined;
    },
    clear() {
      order.length = 0;
      buffers.clear();
    },
  };
}

/**
 * Bundle an {@link Inspector} as a {@link Plugin} for an agent's `use:` array.
 *
 * @param inspector - an existing inspector; a fresh one is created (and returned on `.inspector`) if omitted.
 * @returns a `Plugin` whose `consumers` include the inspector, with the inspector exposed on `.inspector`.
 * @example
 * ```ts
 * const dev = devtoolsPlugin();
 * const a = agent({ model, instructions: "…", use: [dev] });
 * await a.run("hi");
 * dev.inspector.latest(); // the captured run
 * ```
 */
export function devtoolsPlugin(inspector: Inspector = createInspector()): Plugin & { readonly inspector: Inspector } {
  return { name: "mithril.devtools", consumers: [inspector.consumer], inspector };
}

let globalInspector: Inspector | undefined;

/** The process-wide default {@link Inspector}, created on first use — a shared sink for a whole app's runs. */
export function getGlobalInspector(): Inspector {
  globalInspector ??= createInspector();
  return globalInspector;
}
