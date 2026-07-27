---
editUrl: false
next: false
prev: false
title: "toolDeclSource"
---

```ts
function toolDeclSource(t, omitApproval?): string;
```

Defined in: [packages/spec/src/codegen.ts:119](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/codegen.ts#L119)

Emit the `const <id> = tool({ … })` declaration for one tool.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `t` | [`ToolSpec`](/mithril/reference/spec/index/interfaces/toolspec/) | `undefined` | the tool to emit. |
| `omitApproval` | `boolean` | `false` | drop `needsApproval` from the emitted literal. |

## Returns

`string`

the declaration source, identical to what [generateProject](/mithril/reference/spec/index/functions/generateproject/) emits for this tool.

## Remarks

Exported as the seam for building a program around ONE tool — a probe that executes the body
offline, say — so such a program compiles the very same source the real run does instead of a lookalike
that can drift from it. `omitApproval` exists for that case: a probe that inherited `needsApproval` would
suspend waiting for a human decision that no probe UI is there to give.

## Example

```ts
const src = toolDeclSource(spec.decls.find((d) => d.id === "weather") as ToolSpec, true);
```
