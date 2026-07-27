---
editUrl: false
next: false
prev: false
title: "buildDefinition"
---

```ts
function buildDefinition(input, ctx): ToolDefinition;
```

Defined in: [definition.ts:73](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/definition.ts#L73)

Turn `define_tool` arguments into a validated ToolDefinition.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | [`DefineToolInput`](/mithril/reference/authoring/index/interfaces/definetoolinput/) | the model-supplied definition. |
| `ctx` | \{ `current`: `number`; `has`: (`name`) => `boolean`; `maxTools`: `number`; \} | `has` reports whether a name is already registered; `maxTools`/`current` enforce the cap. |
| `ctx.current` | `number` | - |
| `ctx.has` | (`name`) => `boolean` | - |
| `ctx.maxTools` | `number` | - |

## Returns

`ToolDefinition`

the definition, with its digest attached.

## Throws

MithrilError `INVALID_TOOL_DEFINITION` with a message written for the model to act on.
