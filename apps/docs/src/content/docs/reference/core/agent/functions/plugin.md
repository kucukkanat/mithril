---
editUrl: false
next: false
prev: false
title: "plugin"
---

## Call Signature

```ts
function plugin<Deps>(): <Tools>(p) => Plugin<Deps, Tools>;
```

Defined in: [packages/core/src/agent/factory.ts:138](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L138)

Define a plugin — a reusable bundle of tools, middleware, and event consumers — or curry over `Deps`.

### Type Parameters

| Type Parameter |
| ------ |
| `Deps` |

### Returns

the plugin, or a `Deps`-bound plugin factory when called with no arguments.

\<`Tools`\>(`p`) => [`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`Deps`, `Tools`\>

### Remarks

Curried like [tool](/reference/core/agent/functions/tool/)/[agent](/reference/core/agent/functions/agent/): `plugin<Deps>()(def)` binds `Deps`; `plugin(def)`
covers the no-deps case. The definition is returned as-is; the helper exists purely for type inference.
Pass the result to [AgentConfig](/reference/core/agent/interfaces/agentconfig/)'s `use` array. A plugin's `tools` are merged with the agent's own
`tools`, its `middleware` is inserted at the plugin's position (depth-first), and its `consumers`
subscribe to every emitted event.

## Call Signature

```ts
function plugin<Tools>(p): Plugin<unknown, Tools>;
```

Defined in: [packages/core/src/agent/factory.ts:139](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/factory.ts#L139)

Define a plugin — a reusable bundle of tools, middleware, and event consumers — or curry over `Deps`.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`unknown`\>[] | \[\] |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | [`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`unknown`, `Tools`\> | the [Plugin](/reference/core/protocol/interfaces/plugin/) definition, omitted in the curried form. |

### Returns

[`Plugin`](/reference/core/protocol/interfaces/plugin/)\<`unknown`, `Tools`\>

the plugin, or a `Deps`-bound plugin factory when called with no arguments.

### Remarks

Curried like [tool](/reference/core/agent/functions/tool/)/[agent](/reference/core/agent/functions/agent/): `plugin<Deps>()(def)` binds `Deps`; `plugin(def)`
covers the no-deps case. The definition is returned as-is; the helper exists purely for type inference.
Pass the result to [AgentConfig](/reference/core/agent/interfaces/agentconfig/)'s `use` array. A plugin's `tools` are merged with the agent's own
`tools`, its `middleware` is inserted at the plugin's position (depth-first), and its `consumers`
subscribe to every emitted event.
