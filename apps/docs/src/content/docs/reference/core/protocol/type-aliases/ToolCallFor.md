---
editUrl: false
next: false
prev: false
title: "ToolCallFor"
---

```ts
type ToolCallFor<Tools> = { [T in Tools[number] as ToolNameOf<T> & string]: T extends Tool<infer N, infer In, infer _O, infer _D> ? { callId: string; input: In; name: N } : never }[ToolNameOf<Tools[number]> & string];
```

Defined in: [packages/core/src/protocol/narrow.ts:19](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/narrow.ts#L19)

The union of name-correlated `tool.call` shapes for a concrete tool tuple.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`unknown`\>[] | A `const` tuple of concrete [Tool](/mithril/reference/core/protocol/interfaces/tool/)s (not the [AnyTool](/mithril/reference/core/protocol/type-aliases/anytool/) bound). |

## Remarks

Each member pairs a tool's literal `name` with its precise `input` type, so a
`switch` on `name` narrows `input` exactly. Recovers per-tool input types only
where used, keeping instantiation cost local. Paired with [narrow](/mithril/reference/core/protocol/functions/narrow/).
