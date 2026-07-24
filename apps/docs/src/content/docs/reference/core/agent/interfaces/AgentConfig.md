---
editUrl: false
next: false
prev: false
title: "AgentConfig"
---

Defined in: [packages/core/src/agent/agent-types.ts:160](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L160)

The declarative configuration of an agent, passed to [agent](/mithril/reference/core/agent/functions/agent/) (or a harness-bound factory).

## Remarks

- `model` is a [ModelInput](/mithril/reference/core/protocol/type-aliases/modelinput/) (a self-wiring ModelHandle or a `provider/model` id).
- `instructions` may be a static string or a function of [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/) (resolved per run).
- `maxSteps` defaults to 16.
- `output` opts into structured output: the final text is parsed and validated against the schema; the
  default [healing](/mithril/reference/core/agent/interfaces/agentconfig/#healing) stack re-asks the model on a validation failure before giving up.
- `healing` is the pluggable self-healing stack ([Middleware](/mithril/reference/core/protocol/interfaces/middleware/)). Omitted ⇒ the batteries-included
  default (arg-repair, loop guard, per-tool retry budget, structured-output retry). Pass `false` (or
  `[]`) for the raw loop — no arg coercion, no loop detection, unbounded tool retries, no output retry;
  or pass an explicit array to pick/configure behaviors, e.g. `healing: [healing.loopGuard({ haltAt: 3 })]`.
  Crash-hardening (a throwing provider/middleware becomes a typed `run.error`) is never disabled.
- `use` composes plugins and middleware (§3.8).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | - | the tuple of tools available to the model; drives typed tool inference. |
| `Deps` | - | the dependency object injected into tool/instruction [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/)s. |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | `string` | the output type, inferred from `output`'s schema (or `string` when absent). |

## Properties

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/agent-types.ts:174](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L174)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/agent-types.ts:162](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L162)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:171](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L171)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:164](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L164)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:170](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L170)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/agent-types.ts:161](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L161)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:165](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L165)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonSchemaConverter;
```

Defined in: [packages/core/src/agent/agent-types.ts:169](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L169)

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:163](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L163)

***

### use?

```ts
readonly optional use?: readonly (
  | Middleware<Deps>
  | Plugin<Deps, readonly AnyTool<Deps>[]>)[];
```

Defined in: [packages/core/src/agent/agent-types.ts:175](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L175)
