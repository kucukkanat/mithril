---
editUrl: false
next: false
prev: false
title: "ToolFactory"
---

Defined in: [packages/core/src/agent/factory.ts:96](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/factory.ts#L96)

A `Deps`-bound tool constructor: call it with a [ToolDef](/mithril/reference/core/agent/interfaces/tooldef/) to get a fully typed [Tool](/mithril/reference/core/protocol/interfaces/tool/).

## Remarks

Returned by `tool<Deps>()` and by [createHarness](/mithril/reference/core/agent/functions/createharness/), so each tool definition need not
restate `<Deps>`. `Name`, the input type, and `Out` are all inferred from the def.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object every tool built by this factory receives via `ctx.deps`. |

```ts
ToolFactory<Name, SIn, Out>(def): Tool<Name, Infer<SIn>, Out, Deps>;
```

Defined in: [packages/core/src/agent/factory.ts:97](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/factory.ts#L97)

A `Deps`-bound tool constructor: call it with a [ToolDef](/mithril/reference/core/agent/interfaces/tooldef/) to get a fully typed [Tool](/mithril/reference/core/protocol/interfaces/tool/).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Name` *extends* `string` | - |
| `SIn` *extends* [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> | - |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `def` | [`ToolDef`](/mithril/reference/core/agent/interfaces/tooldef/)\<`Name`, `SIn`, `Deps`, `Out`\> |

## Returns

[`Tool`](/mithril/reference/core/protocol/interfaces/tool/)\<`Name`, `Infer`\<`SIn`\>, `Out`, `Deps`\>

## Remarks

Returned by `tool<Deps>()` and by [createHarness](/mithril/reference/core/agent/functions/createharness/), so each tool definition need not
restate `<Deps>`. `Name`, the input type, and `Out` are all inferred from the def.
