import type { ResumeValue } from "@mithril/core/agent";
import type { EventTransport, MithrilEvent } from "@mithril/core/protocol";
import { type DevtoolsHandle, type DevtoolsPanelOptions, mountDevtoolsPanel, mountRunInspector, type RunInspectorOptions, type RunSource } from "./dom.ts";

// Framework-agnostic Web Components over the vanilla DOM renderer. Register once with
// defineDevtoolsElements(), then use <mithril-run-inspector> / <mithril-devtools-panel> in ANY framework
// (Vue, Svelte, Angular, Solid) or plain HTML. Set the run source as a JS property (events/source/transport)
// and `context-window` as an attribute. Import `@mithril/devtools/ui.css` for styling.

/**
 * `<mithril-run-inspector>` — the visual inspector as a custom element.
 *
 * @remarks Set `.source` (a `RunHandle`), `.events` (a static log), or `.transport` (an `EventTransport`) as
 * JS properties; set `context-window` as an attribute. Set `.onResolve` to enable the suspension controls.
 */
export class MithrilRunInspectorElement extends HTMLElement {
  private handle: DevtoolsHandle<RunInspectorOptions> | undefined;
  private _events: readonly MithrilEvent[] | undefined;
  private _source: RunSource | undefined;
  private _transport: EventTransport | undefined;
  private _onResolve: ((resolution: ResumeValue) => void) | undefined;

  static get observedAttributes(): readonly string[] {
    return ["context-window"];
  }

  set events(v: readonly MithrilEvent[] | undefined) {
    this._events = v;
    this.refresh();
  }
  get events(): readonly MithrilEvent[] | undefined {
    return this._events;
  }
  set source(v: RunSource | undefined) {
    this._source = v;
    this.refresh();
  }
  get source(): RunSource | undefined {
    return this._source;
  }
  set transport(v: EventTransport | undefined) {
    this._transport = v;
    this.refresh();
  }
  get transport(): EventTransport | undefined {
    return this._transport;
  }
  set onResolve(v: ((resolution: ResumeValue) => void) | undefined) {
    this._onResolve = v;
    this.refresh();
  }
  get onResolve(): ((resolution: ResumeValue) => void) | undefined {
    return this._onResolve;
  }

  connectedCallback(): void {
    this.refresh();
  }
  disconnectedCallback(): void {
    this.handle?.destroy();
    this.handle = undefined;
  }
  attributeChangedCallback(): void {
    this.handle?.update(this.options());
  }

  private options(): RunInspectorOptions {
    const cw = this.getAttribute("context-window");
    return {
      ...(this._events !== undefined ? { events: this._events } : {}),
      ...(this._source !== undefined ? { source: this._source } : {}),
      ...(this._transport !== undefined ? { transport: this._transport } : {}),
      ...(cw !== null && cw !== "" ? { contextWindow: Number(cw) } : {}),
      ...(this._onResolve !== undefined ? { onResolve: this._onResolve } : {}),
    };
  }
  private refresh(): void {
    if (!this.isConnected) return;
    if (this.handle) this.handle.update(this.options());
    else this.handle = mountRunInspector(this, this.options());
  }
}

/**
 * `<mithril-devtools-panel>` — a multi-run panel that live-tails the attach `BroadcastChannel`.
 *
 * @remarks Pair with `import "mithril/devtools/attach"`. Attributes: `context-window`, `channel`.
 */
export class MithrilDevtoolsPanelElement extends HTMLElement {
  private handle: DevtoolsHandle<DevtoolsPanelOptions> | undefined;

  static get observedAttributes(): readonly string[] {
    return ["context-window", "channel"];
  }

  connectedCallback(): void {
    this.handle = mountDevtoolsPanel(this, this.options());
  }
  disconnectedCallback(): void {
    this.handle?.destroy();
    this.handle = undefined;
  }
  attributeChangedCallback(): void {
    this.handle?.update(this.options());
  }

  private options(): DevtoolsPanelOptions {
    const cw = this.getAttribute("context-window");
    const channel = this.getAttribute("channel");
    return {
      ...(channel !== null && channel !== "" ? { channel } : {}),
      ...(cw !== null && cw !== "" ? { contextWindow: Number(cw) } : {}),
    };
  }
}

/**
 * Register the devtools custom elements. Call once before using the tags.
 *
 * @param options - `prefix` (default `"mithril"`) → `<mithril-run-inspector>` / `<mithril-devtools-panel>`.
 * @remarks Idempotent — safe to call more than once. No-op on the server (guards on `customElements`).
 * @example
 * ```ts
 * import { defineDevtoolsElements } from "@mithril/devtools/element";
 * import "@mithril/devtools/ui.css";
 *
 * defineDevtoolsElements();
 * const el = document.createElement("mithril-run-inspector");
 * el.source = agent.stream("hi");
 * document.body.append(el);
 * ```
 */
export function defineDevtoolsElements(options?: { readonly prefix?: string }): void {
  if (typeof customElements === "undefined") return;
  const p = options?.prefix ?? "mithril";
  if (customElements.get(`${p}-run-inspector`) === undefined) customElements.define(`${p}-run-inspector`, MithrilRunInspectorElement);
  if (customElements.get(`${p}-devtools-panel`) === undefined) customElements.define(`${p}-devtools-panel`, MithrilDevtoolsPanelElement);
}
