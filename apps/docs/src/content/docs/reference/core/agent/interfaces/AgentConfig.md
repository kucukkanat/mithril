---
editUrl: false
next: false
prev: false
title: "AgentConfig"
---

Defined in: [packages/core/src/agent/agent-types.ts:147](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L147)

The declarative configuration of an agent, passed to [agent](/reference/core/agent/functions/agent/) (or a harness-bound factory).

## Remarks

- `model` is a [ModelInput](/reference/core/protocol/type-aliases/modelinput/) (a self-wiring ModelHandle or a `provider/model` id).
- `instructions` may be a static string or a function of [RunContext](/reference/core/protocol/interfaces/runcontext/) (resolved per run).
- `maxSteps` defaults to 16; `outputRetries` defaults to 2.
- `output` opts into structured output: the final text is parsed and validated against the schema,
  retrying up to `outputRetries` times before failing.
- `use` composes plugins and middleware (§3.8).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | - | the tuple of tools available to the model; drives typed tool inference. |
| `Deps` | - | the dependency object injected into tool/instruction [RunContext](/reference/core/protocol/interfaces/runcontext/)s. |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `string` | the output type, inferred from `output`'s schema (or `string` when absent). |

## Properties

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/agent-types.ts:149](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L149)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:151](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L151)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/agent-types.ts:148](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L148)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:152](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L152)

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:153](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L153)

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:150](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L150)

***

### use?

```ts
readonly optional use?: readonly (
  | Plugin<Deps, readonly AnyTool<Deps>[]>
  | Middleware<Deps>)[];
```

Defined in: [packages/core/src/agent/agent-types.ts:154](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/agent/agent-types.ts#L154)
