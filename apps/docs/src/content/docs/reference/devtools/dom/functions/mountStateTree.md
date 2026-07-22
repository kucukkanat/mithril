---
editUrl: false
next: false
prev: false
title: "mountStateTree"
---

```ts
function mountStateTree(target, options): DevtoolsHandle<StateTreeOptions>;
```

Defined in: [packages/devtools/src/dom.ts:193](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/devtools/src/dom.ts#L193)

Mount the message/tool transcript + span tree (at `cursor`) into `target`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`StateTreeOptions`](/reference/devtools/dom/interfaces/statetreeoptions/) |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`StateTreeOptions`](/reference/devtools/dom/interfaces/statetreeoptions/)\>
