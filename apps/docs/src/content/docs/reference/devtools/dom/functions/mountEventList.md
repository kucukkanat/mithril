---
editUrl: false
next: false
prev: false
title: "mountEventList"
---

```ts
function mountEventList(target, options): DevtoolsHandle<EventListOptions>;
```

Defined in: [packages/devtools/src/dom.ts:169](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/devtools/src/dom.ts#L169)

Mount the colour-coded event log into `target`. Controlled: pass `cursor`/`onSelect` in.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`EventListOptions`](/mithril/reference/devtools/dom/interfaces/eventlistoptions/) |

## Returns

[`DevtoolsHandle`](/mithril/reference/devtools/dom/interfaces/devtoolshandle/)\<[`EventListOptions`](/mithril/reference/devtools/dom/interfaces/eventlistoptions/)\>
