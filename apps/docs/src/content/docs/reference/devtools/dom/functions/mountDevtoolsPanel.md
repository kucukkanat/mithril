---
editUrl: false
next: false
prev: false
title: "mountDevtoolsPanel"
---

```ts
function mountDevtoolsPanel(target, options): DevtoolsHandle<DevtoolsPanelOptions>;
```

Defined in: [packages/devtools/src/dom.ts:362](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/devtools/src/dom.ts#L362)

Mount a multi-run panel that live-tails every run in the process via the attach shim's `BroadcastChannel`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | `HTMLElement` | the host element. |
| `options` | [`DevtoolsPanelOptions`](/mithril/reference/devtools/dom/interfaces/devtoolspaneloptions/) | `channel` (default [DEVTOOLS\_CHANNEL](/mithril/reference/devtools/dom/variables/devtools_channel/)) and optional `contextWindow`. |

## Returns

[`DevtoolsHandle`](/mithril/reference/devtools/dom/interfaces/devtoolshandle/)\<[`DevtoolsPanelOptions`](/mithril/reference/devtools/dom/interfaces/devtoolspaneloptions/)\>

a [DevtoolsHandle](/mithril/reference/devtools/dom/interfaces/devtoolshandle/).

## Remarks

Pair with `import "mithril/devtools/attach"`. Lists runs with a switcher and renders a
[mountRunInspector](/mithril/reference/devtools/dom/functions/mountruninspector/) for the selected one.
