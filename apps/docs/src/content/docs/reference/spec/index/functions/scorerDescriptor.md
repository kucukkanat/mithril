---
editUrl: false
next: false
prev: false
title: "scorerDescriptor"
---

```ts
function scorerDescriptor(type): 
  | ScorerDescriptor
  | undefined;
```

Defined in: packages/spec/src/scorers.ts:144

Look up a [ScorerDescriptor](/reference/spec/index/interfaces/scorerdescriptor/) by its `type`; `undefined` for an unknown scorer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `string` |

## Returns

  \| [`ScorerDescriptor`](/reference/spec/index/interfaces/scorerdescriptor/)
  \| `undefined`
