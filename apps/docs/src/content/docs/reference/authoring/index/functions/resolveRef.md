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

Defined in: [compose.ts:62](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/compose.ts#L62)

Resolve one [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/) against the composed tool's input and the outputs so far.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ValueRef`](/mithril/reference/authoring/index/type-aliases/valueref/) |
| `input` | `JsonValue` |
| `outputs` | `Readonly`\<`Record`\<`string`, `JsonValue`\>\> |

## Returns

`JsonValue` \| `undefined`
