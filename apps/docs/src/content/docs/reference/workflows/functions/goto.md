---
editUrl: false
next: false
prev: false
title: "goto"
---

```ts
function goto<S>(next, state): StepResult<S>;
```

Defined in: [packages/workflows/src/index.ts:87](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/workflows/src/index.ts#L87)

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
