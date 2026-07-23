---
editUrl: false
next: false
prev: false
title: "mountStateTree"
---

```ts
function mountStateTree(target, options): DevtoolsHandle<StateTreeOptions>;
```

Defined in: [packages/devtools/src/dom.ts:193](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/devtools/src/dom.ts#L193)

Mount the message/tool transcript + span tree (at `cursor`) into `target`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`StateTreeOptions`](/reference/devtools/dom/interfaces/statetreeoptions/) |

## Returns

[`DevtoolsHandle`](/reference/devtools/dom/interfaces/devtoolshandle/)\<[`StateTreeOptions`](/reference/devtools/dom/interfaces/statetreeoptions/)\>
