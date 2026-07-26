---
editUrl: false
next: false
prev: false
title: "inheritsApproval"
---

```ts
function inheritsApproval(comp, needsApproval): boolean;
```

Defined in: [compose.ts:116](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L116)

Whether a composition must inherit an approval gate from the tools it calls.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `comp` | [`ToolComposition`](/mithril/reference/authoring/index/interfaces/toolcomposition/) | the composition. |
| `needsApproval` | (`name`) => `boolean` \| ((...`a`) => `unknown`) \| `undefined` | a lookup for a referenced tool's `needsApproval`. |

## Returns

`boolean`

`true` when any referenced tool is gated.

## Remarks

Without this, composition is an approval-laundering machine: wrap `deploy` in `do_the_thing` and the gate
evaporates. A *predicate* counts as gated — it may return `true` for some input, and the conservative
reading is the only safe one.
