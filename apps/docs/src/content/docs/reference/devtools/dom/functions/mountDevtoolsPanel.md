---
editUrl: false
next: false
prev: false
title: "mountDevtoolsPanel"
---

```ts
function mountDevtoolsPanel(target, options): DevtoolsHandle<DevtoolsPanelOptions>;
```

Defined in: [packages/devtools/src/dom.ts:362](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/devtools/src/dom.ts#L362)

Mount a multi-run panel that live-tails every run in the process via the attach shim's `BroadcastChannel`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | `HTMLElement` | the host element. |
| `options` | [`DevtoolsPanelOptions`](/reference/devtools/dom/interfaces/devtoolspaneloptions/) | `channel` (default [DEVTOOLS\_CHANNEL](/reference/devtools/dom/variables/devtools_channel/)) and optional `contextWindow`. |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`DevtoolsPanelOptions`](/reference/devtools/dom/interfaces/devtoolspaneloptions/)\>

a [DevtoolsHandle](/reference/devtools/dom/interfaces/devtoolshandle/).

## Remarks

Pair with `import "mithril/devtools/attach"`. Lists runs with a switcher and renders a
[mountRunInspector](/reference/devtools/dom/functions/mountruninspector/) for the selected one.
