---
editUrl: false
next: false
prev: false
title: "AgentFactory"
---

Defined in: [packages/core/src/agent/agent-types.ts:231](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L231)

A `Deps`-bound agent constructor: call it with an [AgentConfig](/mithril/reference/core/agent/interfaces/agentconfig/) to get an [Agent](/mithril/reference/core/agent/interfaces/agent/).

## Remarks

Returned by `agent<Deps>()` and by [createHarness](/mithril/reference/core/agent/functions/createharness/), so tool/agent definitions
don't have to restate `<Deps>` at each call site. `Tools` and `Out` are inferred from the config.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object every agent built by this factory injects. |

```ts
AgentFactory<Tools, Out>(config): Agent<Tools, Deps, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:232](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/core/src/agent/agent-types.ts#L232)

A `Deps`-bound agent constructor: call it with an [AgentConfig](/mithril/reference/core/agent/interfaces/agentconfig/) to get an [Agent](/mithril/reference/core/agent/interfaces/agent/).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | \[\] |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`AgentConfig`](/mithril/reference/core/agent/interfaces/agentconfig/)\<`Tools`, `Deps`, `Out`\> |

## Returns

[`Agent`](/mithril/reference/core/agent/interfaces/agent/)\<`Tools`, `Deps`, `Out`\>

## Remarks

Returned by `agent<Deps>()` and by [createHarness](/mithril/reference/core/agent/functions/createharness/), so tool/agent definitions
don't have to restate `<Deps>` at each call site. `Tools` and `Out` are inferred from the config.
