---
editUrl: false
next: false
prev: false
title: "mountRunInspector"
---

```ts
function mountRunInspector(target, options): DevtoolsHandle<RunInspectorOptions>;
```

Defined in: [packages/devtools/src/dom.ts:236](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/devtools/src/dom.ts#L236)

Mount the full visual inspector into `target` — no framework required.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | `HTMLElement` | the host element (the inspector appends a `.mth-dev` root to it). |
| `options` | [`RunInspectorOptions`](/reference/devtools/dom/interfaces/runinspectoroptions/) | the run source plus optional `contextWindow` / `onResolve` ([RunInspectorOptions](/reference/devtools/dom/interfaces/runinspectoroptions/)). |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`RunInspectorOptions`](/reference/devtools/dom/interfaces/runinspectoroptions/)\>

a [DevtoolsHandle](/reference/devtools/dom/interfaces/devtoolshandle/) — `update()` to swap options/source, `destroy()` to tear down.

## Remarks

Import `@mithril/devtools/ui.css` for styling. Owns its own time-travel cursor and tail-follow.

## Example

```ts
import { mountRunInspector } from "@mithril/devtools/dom";
import "@mithril/devtools/ui.css";

const view = mountRunInspector(document.getElementById("dev"), { source: agent.stream("hi"), contextWindow: 200_000 });
// later: view.destroy();
```
