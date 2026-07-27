---
editUrl: false
next: false
prev: false
title: "mountStateTree"
---

```ts
function mountStateTree(target, options): DevtoolsHandle<StateTreeOptions>;
```

Defined in: [packages/devtools/src/dom.ts:193](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/devtools/src/dom.ts#L193)

Mount the message/tool transcript + span tree (at `cursor`) into `target`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`StateTreeOptions`](/mithril/reference/devtools/dom/interfaces/statetreeoptions/) |

## Returns

[`DevtoolsHandle`](/mithril/reference/devtools/dom/interfaces/devtoolshandle/)\<[`StateTreeOptions`](/mithril/reference/devtools/dom/interfaces/statetreeoptions/)\>
