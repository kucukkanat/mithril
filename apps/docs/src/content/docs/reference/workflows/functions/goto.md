---
editUrl: false
next: false
prev: false
title: "goto"
---

```ts
function goto<S>(next, state): StepResult<S>;
```

Defined in: [packages/workflows/src/index.ts:87](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/workflows/src/index.ts#L87)

Build a [StepResult](/mithril/reference/workflows/type-aliases/stepresult/) that routes to another step, carrying `state` forward.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `next` | `string` | the name of the step to run next. |
| `state` | `S` | - |

## Returns

[`StepResult`](/mithril/reference/workflows/type-aliases/stepresult/)\<`S`\>
