---
editUrl: false
next: false
prev: false
title: "JsonSafe"
---

```ts
type JsonSafe<T> = T extends JsonValue ? T : never;
```

Defined in: [packages/core/src/protocol/primitives.ts:31](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/protocol/primitives.ts#L31)

Compile-time assertion that `T` is [JsonValue](/reference/core/protocol/type-aliases/jsonvalue/): resolves to `T` when
safe, otherwise `never`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Remarks

Applied at boundaries that produce wire values (tool output, structured
output, suspension payload) so a non-serializable shape fails at its
definition rather than later at `structuredClone`.
