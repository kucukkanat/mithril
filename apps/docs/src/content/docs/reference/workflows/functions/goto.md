---
editUrl: false
next: false
prev: false
title: "goto"
---

```ts
function goto<S>(next, state): StepResult<S>;
```

Defined in: [packages/workflows/src/index.ts:87](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/workflows/src/index.ts#L87)

Build a [StepResult](/reference/workflows/type-aliases/stepresult/) that routes to another step, carrying `state` forward.

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

[`StepResult`](/reference/workflows/type-aliases/stepresult/)\<`S`\>
