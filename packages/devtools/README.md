# @mithril/devtools

**"DevTools for agents."** A run inspector for Mithril — **framework-agnostic**:

- **Headless core** (`@mithril/devtools`) — a pure `EventConsumer` that captures runs, plus DOM-free
  selectors (`buildSpanTree`, `contextMeter`, `classifyEvent`, …). Works in any runtime.
- **The UI** — event stream, span/sub-run tree, cost + context meters, a time-travel scrubber, and an
  all-tier suspension card, shipped three ways over **one rendering implementation**:
  - `@mithril/devtools/element` — **Web Components** (`<mithril-run-inspector>`) for any framework or plain HTML.
  - `@mithril/devtools/dom` — **mount functions** (`mountRunInspector(el, opts)`) for imperative control.
  - `@mithril/devtools/ui` — **React** components (thin wrappers over the above).
  - `@mithril/devtools/ui.css` — self-contained, themeable styles (used by all three).
- **Zero-touch attach** (`mithril/devtools/attach`) — one import fans *every* run out to the local inspector.

## Any framework (Web Component)

```ts
import { defineDevtoolsElements } from "@mithril/devtools/element";
import "@mithril/devtools/ui.css";

defineDevtoolsElements(); // registers <mithril-run-inspector> / <mithril-devtools-panel>
const el = document.createElement("mithril-run-inspector");
el.setAttribute("context-window", "200000");
el.source = agent.stream("hi"); // or .events = recorded, .transport = bus
document.body.append(el);
```

## Vanilla mount function

```ts
import { mountRunInspector } from "@mithril/devtools/dom";
import "@mithril/devtools/ui.css";

const view = mountRunInspector(document.getElementById("dev"), { source: agent.stream("hi"), contextWindow: 200_000 });
// view.update({ events }) to swap the source; view.destroy() to tear down.
```

Also exports `mountDevtoolsPanel`, `mountEventList`, `mountStateTree`.

## Zero-touch attach

Add one side-effect import at your entry point (or set `MITHRIL_DEVTOOLS=1`):

```ts
import "mithril/devtools/attach";
// every agent.run()/stream() in this process is now captured — no other change.
```

It no-ops in production (unless `MITHRIL_DEVTOOLS` is set) and tree-shakes. Under the hood it registers a
process-wide `registerGlobalConsumer` (from `@mithril/core/agent`) and, in a browser, mirrors events onto a
`BroadcastChannel` for cross-tab live-tail.

## The UI

```tsx
import { RunInspector } from "@mithril/devtools/ui";
import "@mithril/devtools/ui.css";

// point it at a live run, a static log, or an EventTransport:
<RunInspector source={agent.stream("hi")} contextWindow={200_000} />
<RunInspector events={recorded.events} />
<RunInspector transport={bus} />
```

Pass `onResolve` for a live resumable run to turn the suspension card into working Approve / Reject / Resolve
controls (approval, tool-returned `suspend`, `ctx.suspend`, and handoffs). For a multi-run view driven by the
attach `BroadcastChannel`, use `<DevtoolsPanel />`. The CSS is themeable — every colour is a `--d-*` / `--k-*`
CSS variable scoped to the component, dark-first with a light mode.

## Headless

```ts
import { createInspector, buildSpanTree, contextMeter } from "@mithril/devtools";

const inspector = createInspector();
await agent({ model, instructions: "…", use: [{ name: "dev", consumers: [inspector.consumer] }] }).run("hi");
inspector.latest()?.state.status; // "completed"
```

## API

- Core: `createInspector({ maxRuns? })`, `devtoolsPlugin(inspector?)`, `getGlobalInspector()`.
- Selectors: `classifyEvent`, `previewEvent`, `buildSpanTree`, `contextMeter`, `compactionSavings`.
- DOM (`/dom`): `mountRunInspector`, `mountDevtoolsPanel`, `mountEventList`, `mountStateTree`, `DEVTOOLS_CHANNEL`.
- Element (`/element`): `defineDevtoolsElements()`, `MithrilRunInspectorElement`, `MithrilDevtoolsPanelElement`.
- React (`/ui`): `RunInspector`, `DevtoolsPanel`, `EventList`, `StateTree` — thin wrappers over `/dom`.
- Attach (`/attach`, or `mithril/devtools/attach`): side-effect import, plus `attachDevtools()`,
  `devtoolsEnabled()`, `DEVTOOLS_CHANNEL`.
- Only `/ui` needs React (an optional peer dependency); `/dom` and `/element` are React-free.
