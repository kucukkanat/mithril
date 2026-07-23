---
editUrl: false
next: false
prev: false
title: "done"
---

```ts
function done<S>(state): StepResult<S>;
```

Defined in: [packages/workflows/src/index.ts:92](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/workflows/src/index.ts#L92)

Build a [StepResult](/reference/workflows/type-aliases/stepresult/) that finishes the workflow with the given final `state`.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `S` |

## Returns

[`StepResult`](/reference/workflows/type-aliases/stepresult/)\<`S`\>
