---
editUrl: false
next: false
prev: false
title: "toolRegistry"
---

```ts
function toolRegistry<Deps>(seed): ToolRegistry<Deps>;
```

Defined in: [packages/core/src/agent/tool-registry.ts:50](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/tool-registry.ts#L50)

Build a fresh [ToolRegistry](/mithril/reference/core/protocol/interfaces/toolregistry/) seeded with an agent's statically declared tools.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency bag the registered tools require. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `seed` | readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | the tools present from step 0 (`AgentConfig.tools` plus plugins' static `tools`). |

## Returns

[`ToolRegistry`](/mithril/reference/core/protocol/interfaces/toolregistry/)\<`Deps`\>

a live registry, for exactly one run.

## Remarks

One registry per run, never shared: a registry outliving a run would break run isolation and make
`replay(log)` non-reproducible.

Seed entries get `static` provenance and are **not revocable**. Collisions within the seed itself are
rejected too — two tools with the same name is an agent-configuration bug, and silently keeping one
would make which capability the agent has depend on array order.

## Example

```ts
import { toolRegistry } from "@mithril/core/agent";

const registry = toolRegistry([getWeather, sendEmail]);
registry.list().length; // 2
```
