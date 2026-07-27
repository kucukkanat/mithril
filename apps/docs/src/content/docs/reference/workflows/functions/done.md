---
editUrl: false
next: false
prev: false
title: "done"
---

```ts
function done<S>(state): StepResult<S>;
```

Defined in: [packages/workflows/src/index.ts:92](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/workflows/src/index.ts#L92)

Build a [StepResult](/mithril/reference/workflows/type-aliases/stepresult/) that finishes the workflow with the given final `state`.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `S` |

## Returns

[`StepResult`](/mithril/reference/workflows/type-aliases/stepresult/)\<`S`\>
