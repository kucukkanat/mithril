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

Defined in: [compose.ts:62](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/authoring/src/compose.ts#L62)

Resolve one [ValueRef](/mithril/reference/authoring/index/type-aliases/valueref/) against the composed tool's input and the outputs so far.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`ValueRef`](/mithril/reference/authoring/index/type-aliases/valueref/) |
| `input` | `JsonValue` |
| `outputs` | `Readonly`\<`Record`\<`string`, `JsonValue`\>\> |

## Returns

`JsonValue` \| `undefined`
