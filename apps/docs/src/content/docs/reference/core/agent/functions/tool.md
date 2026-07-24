---
editUrl: false
next: false
prev: false
title: "tool"
---

## Call Signature

```ts
function tool<Deps>(): ToolFactory<Deps>;
```

Defined in: [packages/core/src/agent/factory.ts:125](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L125)

Define a tool, or curry over `Deps` first.

### Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

### Returns

[`ToolFactory`](/mithril/reference/core/agent/interfaces/toolfactory/)\<`Deps`\>

the typed [Tool](/mithril/reference/core/protocol/interfaces/tool/), or a [ToolFactory](/mithril/reference/core/agent/interfaces/toolfactory/) when called with no arguments.

### Remarks

Two forms:
- `tool<Deps>()` returns a [ToolFactory](/mithril/reference/core/agent/interfaces/toolfactory/) that binds `Deps` for every subsequent definition.
- `tool(def)` defines a single tool inline (dependency-free unless bound via [createHarness](/mithril/reference/core/agent/functions/createharness/)).

The definition is returned essentially as-is; the value of this helper is the type inference it drives
(tool name, validated input type, and JSON-safe output type).

### Example

```ts
import { tool } from "@mithril/core/agent";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Look up the current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  async execute({ city }) {
    return `It is 22°C in ${city}.`;
  },
});
```

## Call Signature

```ts
function tool<Name, SIn, Out>(def): Tool<Name, Infer<SIn>, Out, unknown>;
```

Defined in: [packages/core/src/agent/factory.ts:126](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/factory.ts#L126)

Define a tool, or curry over `Deps` first.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Name` *extends* `string` | - |
| `SIn` *extends* [`StandardSchemaV1`](/mithril/reference/core/protocol/interfaces/standardschemav1/)\<`unknown`, `unknown`\> | - |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `def` | [`ToolDef`](/mithril/reference/core/agent/interfaces/tooldef/)\<`Name`, `SIn`, `unknown`, `Out`\> | the [ToolDef](/mithril/reference/core/agent/interfaces/tooldef/), omitted in the curried form. |

### Returns

[`Tool`](/mithril/reference/core/protocol/interfaces/tool/)\<`Name`, `Infer`\<`SIn`\>, `Out`, `unknown`\>

the typed [Tool](/mithril/reference/core/protocol/interfaces/tool/), or a [ToolFactory](/mithril/reference/core/agent/interfaces/toolfactory/) when called with no arguments.

### Remarks

Two forms:
- `tool<Deps>()` returns a [ToolFactory](/mithril/reference/core/agent/interfaces/toolfactory/) that binds `Deps` for every subsequent definition.
- `tool(def)` defines a single tool inline (dependency-free unless bound via [createHarness](/mithril/reference/core/agent/functions/createharness/)).

The definition is returned essentially as-is; the value of this helper is the type inference it drives
(tool name, validated input type, and JSON-safe output type).

### Example

```ts
import { tool } from "@mithril/core/agent";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Look up the current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  async execute({ city }) {
    return `It is 22°C in ${city}.`;
  },
});
```
