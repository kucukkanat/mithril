---
editUrl: false
next: false
prev: false
title: "materialize"
---

```ts
function materialize(def, extra?): AnyTool<unknown>;
```

Defined in: [materialize.ts:28](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/materialize.ts#L28)

Rebuild a callable tool from its replayable definition.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `def` | `ToolDefinition` | the definition. |
| `extra` | [`Materializers`](/mithril/reference/authoring/index/interfaces/materializers/) | materializers for additional `body.kind`s. |

## Returns

`AnyTool`\<`unknown`\>

the tool, ready to register.

## Throws

MithrilError `UNKNOWN_TOOL_BODY` when nothing can interpret the body.

## Remarks

`needsApproval` is read off the definition rather than recomputed, so an inherited gate (see
`inheritsApproval`) survives a resume — the alternative would quietly ungate a composed tool the moment
a run was suspended and continued.
