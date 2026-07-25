---
editUrl: false
next: false
prev: false
title: "resolveRef"
---

```ts
function resolveRef(
   ref, 
   input, 
   outputs): JsonValue | undefined;
```

Defined in: compose.ts:62

Resolve one [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/) against the composed tool's input and the outputs so far.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ValueRef`](/mithril/reference/authoring/index/type-aliases/valueref/) |
| `input` | `JsonValue` |
| `outputs` | `Readonly`\<`Record`\<`string`, `JsonValue`\>\> |

## Returns

`JsonValue` \| `undefined`
