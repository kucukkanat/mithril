---
editUrl: false
next: false
prev: false
title: "mountEventList"
---

```ts
function mountEventList(target, options): DevtoolsHandle<EventListOptions>;
```

Defined in: [packages/devtools/src/dom.ts:169](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/devtools/src/dom.ts#L169)

Mount the colour-coded event log into `target`. Controlled: pass `cursor`/`onSelect` in.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`EventListOptions`](/mithril/reference/devtools/dom/interfaces/eventlistoptions/) |

## Returns

[`DevtoolsHandle`](/mithril/reference/devtools/dom/interfaces/devtoolshandle/)\<[`EventListOptions`](/mithril/reference/devtools/dom/interfaces/eventlistoptions/)\>
