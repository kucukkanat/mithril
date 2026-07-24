---
editUrl: false
next: false
prev: false
title: "mountStateTree"
---

```ts
function mountStateTree(target, options): DevtoolsHandle<StateTreeOptions>;
```

Defined in: [packages/devtools/src/dom.ts:193](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/dom.ts#L193)

Mount the message/tool transcript + span tree (at `cursor`) into `target`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `HTMLElement` |
| `options` | [`StateTreeOptions`](/mithril/reference/devtools/dom/interfaces/statetreeoptions/) |

## Returns

[`DevtoolsHandle`](/mithril/reference/devtools/dom/interfaces/devtoolshandle/)\<[`StateTreeOptions`](/mithril/reference/devtools/dom/interfaces/statetreeoptions/)\>
