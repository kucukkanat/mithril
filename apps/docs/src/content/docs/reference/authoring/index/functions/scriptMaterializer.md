---
editUrl: false
next: false
prev: false
title: "scriptMaterializer"
---

```ts
function scriptMaterializer(opts): (def) => AnyTool<unknown>;
```

Defined in: [script.ts:84](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/script.ts#L84)

Build the `body.kind: "script"` materializer.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`ScriptOptions`](/mithril/reference/authoring/index/interfaces/scriptoptions/) | see [ScriptOptions](/mithril/reference/authoring/index/interfaces/scriptoptions/). |

## Returns

a materializer to pass to [toolAuthoring](/mithril/reference/authoring/index/functions/toolauthoring/) via `materializers`.

(`def`) => `AnyTool`\<`unknown`\>

## Throws

MithrilError `UNSAFE_RUNNER` when a local runner is supplied without `allowLocalRunner`.

## Remarks

Prefer `toolAuthoring({ script: … })`, which wires this up for you.
