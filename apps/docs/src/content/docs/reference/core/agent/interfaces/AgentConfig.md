---
editUrl: false
next: false
prev: false
title: "AgentConfig"
---

Defined in: [packages/core/src/agent/agent-types.ts:167](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L167)

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

Defined in: [packages/core/src/agent/agent-types.ts:182](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L182)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/agent-types.ts:169](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L169)

***

### maxConcurrentTools?

```ts
readonly optional maxConcurrentTools?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:179](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L179)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:178](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L178)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:171](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L171)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:177](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L177)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/agent-types.ts:168](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L168)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:172](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L172)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonSchemaConverter;
```

Defined in: [packages/core/src/agent/agent-types.ts:176](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L176)

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:170](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L170)

***

### use?

```ts
readonly optional use?: readonly (
  | Middleware<Deps>
  | Plugin<Deps, readonly AnyTool<Deps>[]>)[];
```

Defined in: [packages/core/src/agent/agent-types.ts:183](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/agent/agent-types.ts#L183)
