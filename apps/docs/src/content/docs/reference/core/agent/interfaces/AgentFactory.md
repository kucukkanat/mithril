---
editUrl: false
next: false
prev: false
title: "AgentFactory"
---

Defined in: [packages/core/src/agent/agent-types.ts:194](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L194)

A `Deps`-bound agent constructor: call it with an [AgentConfig](/reference/core/agent/interfaces/agentconfig/) to get an [Agent](/reference/core/agent/interfaces/agent/).

## Remarks

Returned by `agent<Deps>()` and by [createHarness](/reference/core/agent/functions/createharness/), so tool/agent definitions
don't have to restate `<Deps>` at each call site. `Tools` and `Out` are inferred from the config.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object every agent built by this factory injects. |

```ts
AgentFactory<Tools, Out>(config): Agent<Tools, Deps, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:195](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L195)

A `Deps`-bound agent constructor: call it with an [AgentConfig](/reference/core/agent/interfaces/agentconfig/) to get an [Agent](/reference/core/agent/interfaces/agent/).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | \[\] |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`AgentConfig`](/reference/core/agent/interfaces/agentconfig/)\<`Tools`, `Deps`, `Out`\> |

## Returns

[`Agent`](/reference/core/agent/interfaces/agent/)\<`Tools`, `Deps`, `Out`\>

## Remarks

Returned by `agent<Deps>()` and by [createHarness](/reference/core/agent/functions/createharness/), so tool/agent definitions
don't have to restate `<Deps>` at each call site. `Tools` and `Out` are inferred from the config.
