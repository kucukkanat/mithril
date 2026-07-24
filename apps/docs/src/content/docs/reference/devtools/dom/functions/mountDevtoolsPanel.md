---
editUrl: false
next: false
prev: false
title: "mountDevtoolsPanel"
---

```ts
function mountDevtoolsPanel(target, options): DevtoolsHandle<DevtoolsPanelOptions>;
```

Defined in: [packages/devtools/src/dom.ts:362](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/dom.ts#L362)

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
