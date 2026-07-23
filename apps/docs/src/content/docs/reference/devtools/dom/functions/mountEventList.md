---
editUrl: false
next: false
prev: false
title: "mountEventList"
---

```ts
function mountEventList(target, options): DevtoolsHandle<EventListOptions>;
```

Defined in: [packages/devtools/src/dom.ts:169](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/devtools/src/dom.ts#L169)

Mount the colour-coded event log into `target`. Controlled: pass `cursor`/`onSelect` in.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`EventListOptions`](/reference/devtools/dom/interfaces/eventlistoptions/) |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`EventListOptions`](/reference/devtools/dom/interfaces/eventlistoptions/)\>
