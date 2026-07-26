---
editUrl: false
next: false
prev: false
title: "validateComposition"
---

```ts
function validateComposition(comp, known): void;
```

Defined in: [compose.ts:81](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L81)

Validate a composition against the tools available right now.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `comp` | [`ToolComposition`](/mithril/reference/authoring/index/interfaces/toolcomposition/) | the composition to check. |
| `known` | (`name`) => `boolean` | a predicate for "is this tool name registered?". |

## Returns

`void`

## Throws

MithrilError `COMPOSITION_INVALID` for a duplicate/unknown step id, a forward or
self reference, or a step naming a tool that does not exist.

## Remarks

Every check runs at *define* time, not call time — a broken composition is rejected while the model can
still read the error and try again. Because a step may only reference an earlier step and tools that
already exist, the composition graph is acyclic by construction.
