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

Defined in: [compose.ts:62](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/compose.ts#L62)

Resolve one [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/) against the composed tool's input and the outputs so far.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ValueRef`](/mithril/reference/authoring/index/type-aliases/valueref/) |
| `input` | `JsonValue` |
| `outputs` | `Readonly`\<`Record`\<`string`, `JsonValue`\>\> |

## Returns

`JsonValue` \| `undefined`
