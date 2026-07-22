---
editUrl: false
next: false
prev: false
title: "ToolFactory"
---

Defined in: [packages/core/src/agent/factory.ts:63](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L63)

A `Deps`-bound tool constructor: call it with a [ToolDef](/reference/core/agent/interfaces/tooldef/) to get a fully typed [Tool](/reference/core/protocol/interfaces/tool/).

## Remarks

Returned by `tool<Deps>()` and by [createHarness](/reference/core/agent/functions/createharness/), so each tool definition need not
restate `<Deps>`. `Name`, the input type, and `Out` are all inferred from the def.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object every tool built by this factory receives via `ctx.deps`. |

```ts
ToolFactory<Name, SIn, Out>(def): Tool<Name, Infer<SIn>, Out, Deps>;
```

Defined in: [packages/core/src/agent/factory.ts:64](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L64)

A `Deps`-bound tool constructor: call it with a [ToolDef](/reference/core/agent/interfaces/tooldef/) to get a fully typed [Tool](/reference/core/protocol/interfaces/tool/).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Name` *extends* `string` | - |
| `SIn` *extends* [`StandardSchemaV1`](/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> | - |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `def` | [`ToolDef`](/reference/core/agent/interfaces/tooldef/)\<`Name`, `SIn`, `Deps`, `Out`\> |

## Returns

[`Tool`](/reference/core/protocol/interfaces/tool/)\<`Name`, `Infer`\<`SIn`\>, `Out`, `Deps`\>

## Remarks

Returned by `tool<Deps>()` and by [createHarness](/reference/core/agent/functions/createharness/), so each tool definition need not
restate `<Deps>`. `Name`, the input type, and `Out` are all inferred from the def.
