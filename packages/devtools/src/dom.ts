import type { ResumeValue } from "@mithril/core/agent";
import type { EventTransport, MithrilEvent, RunState, SuspensionDescriptor } from "@mithril/core/protocol";
import { replay } from "@mithril/core/protocol";
import { buildSpanTree, classifyEvent, compactionSavings, contextMeter, previewEvent, type SpanNode } from "./selectors.ts";

// The framework-agnostic renderer — plain DOM, no React. This is the SINGLE rendering implementation; the
// React components (`@mithril/devtools/ui`) and the Web Components (`@mithril/devtools/element`) are thin
// adapters over these mount functions. It emits the same `.mth-dev-*` markup that `@mithril/devtools/ui.css`
// styles, and folds everything from the event log (via `replay` + the pure selectors) — it never touches the
// loop. Runs in any browser; import `@mithril/devtools/ui.css` alongside it.

/** The handle returned by every mount function: push new options in, or tear the view down. */
export interface DevtoolsHandle<O> {
  update(options: O): void;
  destroy(): void;
}

/** Anything carrying a live event stream — a `RunHandle` satisfies this. */
export interface RunSource {
  readonly events: AsyncIterable<MithrilEvent>;
}

/** The default `BroadcastChannel` name the attach shim publishes to (see `@mithril/devtools/attach`). */
export const DEVTOOLS_CHANNEL = "mithril.devtools";

// ── tiny DOM helper ─────────────────────────────────────────────────────────────────────────────────────
function h(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className !== undefined) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ── shared render fragments ─────────────────────────────────────────────────────────────────────────────
function stat(label: string, value: string | number): HTMLElement {
  const d = h("div", "mth-dev-stat");
  d.append(h("span", undefined, label), h("b", undefined, String(value)));
  return d;
}

function renderMeters(box: HTMLElement, state: RunState, events: readonly MithrilEvent[], contextWindow: number | undefined): void {
  const m = contextMeter(state, contextWindow !== undefined ? { contextWindow } : undefined);
  const saved = compactionSavings(events);
  box.replaceChildren(h("span", `mth-dev-status s-${state.status}`, state.status), stat("steps", m.steps), stat("tokens", m.tokens), stat("cost", `$${m.cost.toFixed(6)}`));
  if (saved > 0) box.append(stat("compacted", `${saved} tok`));
  if (m.pct !== undefined) {
    const ctx = h("div", "mth-dev-ctx");
    ctx.title = `${m.tokens} / ${m.contextWindow} tokens`;
    const fill = h("div", "mth-dev-ctx-fill");
    fill.style.width = `${Math.min(100, m.pct)}%`;
    ctx.append(fill, h("span", "mth-dev-ctx-label", `${m.pct.toFixed(1)}% ctx`));
    box.append(ctx);
  }
}

function renderEventRows(ol: HTMLElement, events: readonly MithrilEvent[], cursor: number, onSelect: (c: number) => void, follow: boolean): void {
  if (events.length === 0) {
    ol.replaceChildren(h("div", "mth-dev-empty", "No events yet."));
    return;
  }
  const rows = events.map((e, i) => {
    const kind = classifyEvent(e.type);
    const cls = `mth-dev-ev k-${kind}${i < cursor ? "" : " future"}${i === cursor - 1 ? " current" : ""}`;
    const li = h("li", cls);
    li.append(h("span", "mth-dev-seq", String(e.seq)), h("span", "mth-dev-dot"), h("span", "mth-dev-type", e.type), h("span", "mth-dev-preview", previewEvent(e)));
    li.addEventListener("click", () => onSelect(i + 1));
    return li;
  });
  ol.replaceChildren(...rows);
  if (follow) ol.lastElementChild?.scrollIntoView({ block: "nearest" });
}

function spanNodes(nodes: readonly SpanNode[], depth: number, out: HTMLElement[]): void {
  for (const n of nodes) {
    const div = h("div", "mth-dev-span");
    div.style.marginLeft = `${depth * 12}px`;
    const head = h("div", "mth-dev-span-head");
    head.append(h("span", `mth-dev-span-kind sk-${n.span.kind}`, n.span.kind), h("span", "mth-dev-span-count", `${n.events.length} ev`));
    div.append(head);
    out.push(div);
    spanNodes(n.children, depth + 1, out);
  }
}

function renderStateTree(box: HTMLElement, events: readonly MithrilEvent[], cursor: number): void {
  const log = events.slice(0, cursor);
  const state = replay(log);
  const transcript = h("div", "mth-dev-transcript");
  if (state.messages.length === 0) transcript.append(h("div", "mth-dev-empty", "No messages yet."));
  for (const msg of state.messages) {
    const m = h("div", `mth-dev-msg role-${msg.role}`);
    const body = h("div", "mth-dev-msg-body");
    if (msg.content) body.append(h("p", "mth-dev-text", msg.content));
    for (const c of msg.toolCalls) {
      const tc = h("div", "mth-dev-toolcall");
      tc.append(h("span", "mth-dev-tc-name", c.name), h("span", "mth-dev-tc-in", JSON.stringify(c.input)));
      if (c.output !== undefined) tc.append(h("span", "mth-dev-tc-out", `→ ${JSON.stringify(c.output)}`));
      body.append(tc);
    }
    m.append(h("span", "mth-dev-role", msg.role), body);
    transcript.append(m);
  }
  const children: HTMLElement[] = [transcript];
  const tree = buildSpanTree(log);
  if (tree.length > 0) {
    const details = h("details", "mth-dev-spans") as HTMLDetailsElement;
    details.open = true;
    details.append(h("summary", undefined, "Span tree"));
    const nodes: HTMLElement[] = [];
    spanNodes(tree, 0, nodes);
    details.append(...nodes);
    children.push(details);
  }
  const raw = h("details", "mth-dev-raw");
  raw.append(h("summary", undefined, "Raw RunState"), h("pre", undefined, JSON.stringify(state, null, 2)));
  children.push(raw);
  box.replaceChildren(...children);
}

function renderSuspension(slot: HTMLElement, pending: SuspensionDescriptor | undefined, onResolve: ((r: ResumeValue) => void) | undefined): void {
  if (pending === undefined) {
    slot.replaceChildren();
    return;
  }
  const card = h("div", "mth-dev-suspend");
  card.append(h("span", "mth-dev-suspend-badge", `suspended · ${pending.kind}`), h("code", "mth-dev-suspend-payload", JSON.stringify(pending.payload)));
  if (onResolve !== undefined) {
    const actions = h("div", "mth-dev-suspend-actions");
    if (pending.kind === "tool.approval") {
      const approve = h("button", undefined, "Approve") as HTMLButtonElement;
      approve.type = "button";
      approve.addEventListener("click", () => onResolve({ kind: "approve" }));
      const reject = h("button", undefined, "Reject") as HTMLButtonElement;
      reject.type = "button";
      reject.addEventListener("click", () => onResolve({ kind: "reject", message: "rejected in devtools" }));
      actions.append(approve, reject);
    } else {
      const input = document.createElement("input");
      input.className = "mth-dev-resolve-input";
      input.placeholder = "resolution value (JSON or text)";
      const btn = h("button", undefined, "Resolve") as HTMLButtonElement;
      btn.type = "button";
      btn.addEventListener("click", () => {
        let value: unknown = input.value;
        try {
          value = JSON.parse(input.value);
        } catch {
          /* keep as string */
        }
        onResolve({ kind: "resolve", value: value as never });
      });
      actions.append(input, btn);
    }
    card.append(actions);
  }
  slot.replaceChildren(card);
}

// ── controlled primitives (event list / state tree) — the caller owns the cursor ────────────────────────
/** Options for {@link mountEventList}. */
export interface EventListOptions {
  readonly events: readonly MithrilEvent[];
  readonly cursor: number;
  readonly onSelect: (cursor: number) => void;
  readonly follow: boolean;
}

/** Mount the colour-coded event log into `target`. Controlled: pass `cursor`/`onSelect` in. */
export function mountEventList(target: HTMLElement, options: EventListOptions): DevtoolsHandle<EventListOptions> {
  let o = options;
  const ol = h("ol", "mth-dev-events");
  target.append(ol);
  const draw = (): void => renderEventRows(ol, o.events, o.cursor, o.onSelect, o.follow);
  draw();
  return {
    update(next) {
      o = next;
      draw();
    },
    destroy() {
      ol.remove();
    },
  };
}

/** Options for {@link mountStateTree}. */
export interface StateTreeOptions {
  readonly events: readonly MithrilEvent[];
  readonly cursor: number;
}

/** Mount the message/tool transcript + span tree (at `cursor`) into `target`. */
export function mountStateTree(target: HTMLElement, options: StateTreeOptions): DevtoolsHandle<StateTreeOptions> {
  let o = options;
  const box = h("div", "mth-dev-state");
  target.append(box);
  const draw = (): void => renderStateTree(box, o.events, o.cursor);
  draw();
  return {
    update(next) {
      o = next;
      draw();
    },
    destroy() {
      box.remove();
    },
  };
}

// ── the full inspector ──────────────────────────────────────────────────────────────────────────────────
/** Options for {@link mountRunInspector}. Provide exactly one of `events` / `source` / `transport`. */
export interface RunInspectorOptions {
  readonly events?: readonly MithrilEvent[];
  readonly source?: RunSource;
  readonly transport?: EventTransport;
  readonly contextWindow?: number;
  readonly onResolve?: (resolution: ResumeValue) => void;
}

/**
 * Mount the full visual inspector into `target` — no framework required.
 *
 * @param target - the host element (the inspector appends a `.mth-dev` root to it).
 * @param options - the run source plus optional `contextWindow` / `onResolve` ({@link RunInspectorOptions}).
 * @returns a {@link DevtoolsHandle} — `update()` to swap options/source, `destroy()` to tear down.
 * @remarks Import `@mithril/devtools/ui.css` for styling. Owns its own time-travel cursor and tail-follow.
 * @example
 * ```ts
 * import { mountRunInspector } from "@mithril/devtools/dom";
 * import "@mithril/devtools/ui.css";
 *
 * const view = mountRunInspector(document.getElementById("dev"), { source: agent.stream("hi"), contextWindow: 200_000 });
 * // later: view.destroy();
 * ```
 */
export function mountRunInspector(target: HTMLElement, options: RunInspectorOptions): DevtoolsHandle<RunInspectorOptions> {
  let opts = options;
  let events: MithrilEvent[] = options.events !== undefined ? [...options.events] : [];
  let cursor = events.length;
  let pinned = true;
  let unsub: (() => void) | undefined;
  let lastPendingKey = "";

  const root = h("div", "mth-dev");
  root.setAttribute("data-mth-devtools", "");
  const meters = h("div", "mth-dev-meters");
  const suspendSlot = h("div", "mth-dev-suspend-slot");
  const scrubRow = h("div", "mth-dev-scrub-row");
  const scrubber = document.createElement("input");
  scrubber.type = "range";
  scrubber.min = "0";
  scrubber.className = "mth-dev-scrubber";
  scrubber.setAttribute("aria-label", "Time-travel through the run");
  const liveBtn = h("button", "mth-dev-live", "Live") as HTMLButtonElement;
  liveBtn.type = "button";
  const cursorLabel = h("span", "mth-dev-cursor");
  scrubRow.append(scrubber, liveBtn, cursorLabel);
  const cols = h("div", "mth-dev-cols");
  const eventsOl = h("ol", "mth-dev-events");
  const stateBox = h("div", "mth-dev-state");
  cols.append(eventsOl, stateBox);
  root.append(meters, suspendSlot, scrubRow, cols);
  target.append(root);

  const onSelect = (c: number): void => {
    pinned = false;
    cursor = c;
    draw();
  };
  scrubber.addEventListener("input", () => onSelect(Number(scrubber.value)));
  liveBtn.addEventListener("click", () => {
    pinned = true;
    cursor = events.length;
    draw();
  });

  function draw(): void {
    const state = replay(events.slice(0, cursor));
    scrubber.max = String(events.length);
    scrubber.value = String(cursor);
    liveBtn.dataset["pinned"] = String(pinned);
    cursorLabel.textContent = `${cursor}/${events.length}`;
    renderMeters(meters, state, events, opts.contextWindow);
    // Rebuild the suspension card only when the pending identity changes, so a resolve input keeps focus.
    const key = state.pending !== undefined ? `${state.pending.kind}:${state.pending.callId ?? ""}` : "";
    if (key !== lastPendingKey) {
      lastPendingKey = key;
      renderSuspension(suspendSlot, state.pending, opts.onResolve);
    }
    renderEventRows(eventsOl, events, cursor, onSelect, pinned);
    renderStateTree(stateBox, events, cursor);
  }

  function onEvent(e: MithrilEvent): void {
    events = [...events, e];
    if (pinned) cursor = events.length;
    draw();
  }

  function subscribe(): void {
    unsub?.();
    unsub = undefined;
    if (opts.transport !== undefined) {
      unsub = opts.transport.subscribe(onEvent);
    } else if (opts.source !== undefined) {
      let live = true;
      const stream = opts.source.events;
      void (async () => {
        for await (const e of stream) {
          if (!live) break;
          onEvent(e);
        }
      })();
      unsub = () => {
        live = false;
      };
    }
  }

  if (options.events === undefined) subscribe();
  draw();

  return {
    update(next) {
      const sourceChanged = next.source !== opts.source || next.transport !== opts.transport;
      opts = next;
      if (next.events !== undefined) {
        events = [...next.events];
        if (pinned) cursor = events.length;
      } else if (sourceChanged) {
        events = [];
        cursor = 0;
        pinned = true;
        lastPendingKey = "";
        subscribe();
      }
      draw();
    },
    destroy() {
      unsub?.();
      root.remove();
    },
  };
}

// ── multi-run panel (live-tail via BroadcastChannel) ────────────────────────────────────────────────────
/** Options for {@link mountDevtoolsPanel}. */
export interface DevtoolsPanelOptions {
  readonly channel?: string;
  readonly contextWindow?: number;
}

/**
 * Mount a multi-run panel that live-tails every run in the process via the attach shim's `BroadcastChannel`.
 *
 * @param target - the host element.
 * @param options - `channel` (default {@link DEVTOOLS_CHANNEL}) and optional `contextWindow`.
 * @returns a {@link DevtoolsHandle}.
 * @remarks Pair with `import "mithril/devtools/attach"`. Lists runs with a switcher and renders a
 * {@link mountRunInspector} for the selected one.
 */
export function mountDevtoolsPanel(target: HTMLElement, options: DevtoolsPanelOptions): DevtoolsHandle<DevtoolsPanelOptions> {
  let opts = options;
  const runs = new Map<string, MithrilEvent[]>();
  let selected: string | undefined;
  let inspector: DevtoolsHandle<RunInspectorOptions> | undefined;

  const root = h("div", "mth-dev-panel");
  root.setAttribute("data-mth-devtools", "");
  const runsBar = h("div", "mth-dev-runs");
  const host = h("div", "mth-dev-panel-host");
  root.append(runsBar, host);
  target.append(root);

  const inspectorOpts = (id: string): RunInspectorOptions => ({
    events: runs.get(id) ?? [],
    ...(opts.contextWindow !== undefined ? { contextWindow: opts.contextWindow } : {}),
  });

  function showSelected(): void {
    inspector?.destroy();
    inspector = undefined;
    host.replaceChildren();
    if (selected !== undefined) inspector = mountRunInspector(host, inspectorOpts(selected));
  }

  function drawRuns(): void {
    if (runs.size === 0) {
      runsBar.replaceChildren(h("span", "mth-dev-empty", "Waiting for runs…"));
      return;
    }
    const buttons = [...runs.keys()].map((id) => {
      const b = h("button", undefined, id.slice(0, 8)) as HTMLButtonElement;
      b.type = "button";
      b.dataset["active"] = String(id === selected);
      b.addEventListener("click", () => {
        selected = id;
        showSelected();
        drawRuns();
      });
      return b;
    });
    runsBar.replaceChildren(...buttons);
  }

  let bc: BroadcastChannel | undefined;
  if (typeof BroadcastChannel !== "undefined") {
    bc = new BroadcastChannel(opts.channel ?? DEVTOOLS_CHANNEL);
    bc.onmessage = (ev: MessageEvent): void => {
      const e = ev.data as MithrilEvent;
      runs.set(e.runId, [...(runs.get(e.runId) ?? []), e]);
      if (selected === undefined) {
        selected = e.runId;
        showSelected();
      } else if (selected === e.runId) {
        inspector?.update(inspectorOpts(selected));
      }
      drawRuns();
    };
  }
  drawRuns();
  showSelected();

  return {
    update(next) {
      opts = next;
    },
    destroy() {
      bc?.close();
      inspector?.destroy();
      root.remove();
    },
  };
}
