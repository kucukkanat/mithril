---
editUrl: false
next: false
prev: false
title: "mountEventList"
---

```ts
function mountEventList(target, options): DevtoolsHandle<EventListOptions>;
```

Defined in: [packages/devtools/src/dom.ts:169](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/devtools/src/dom.ts#L169)

Mount the colour-coded event log into `target`. Controlled: pass `cursor`/`onSelect` in.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`EventListOptions`](/reference/devtools/dom/interfaces/eventlistoptions/) |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`EventListOptions`](/reference/devtools/dom/interfaces/eventlistoptions/)\>
