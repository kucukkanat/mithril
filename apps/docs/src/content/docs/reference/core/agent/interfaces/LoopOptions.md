---
editUrl: false
next: false
prev: false
title: "LoopOptions"
---

Defined in: [packages/core/src/agent/loop.ts:146](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L146)

The full set of inputs to [agentLoop](/mithril/reference/core/agent/functions/agentloop/) — the flattened, already-resolved form of an
[AgentConfig](/mithril/reference/core/agent/interfaces/agentconfig/) plus per-run options.

## Remarks

This is the loop's low-level contract: [agent](/mithril/reference/core/agent/functions/agent/) assembles it from config + `RunOptions`.
`transport`/`providers`/`runtime` omitted fall back to environment BYOK, the model handle's provider,
and [defaultRuntime](/mithril/reference/core/agent/functions/defaultruntime/) respectively. `resume` drives the cross-process resume path; `output` drives
structured output; `healing` selects the self-correction stack. `maxSteps` defaults to 16.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction contexts. |

## Properties

### consumers?

```ts
readonly optional consumers?: readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/loop.ts:170](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L170)

***

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/agent/loop.ts:151](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L151)

***

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:168](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L168)

The self-healing stack. Omitted ⇒ the batteries-included default ([healing.defaults](/mithril/reference/core/agent/variables/healing/#defaults)); `false`
or `[]` ⇒ a raw loop (crash-hardening still on); an array ⇒ exactly those healing middleware. Composed
ahead of `middlewares` so healing wraps user middleware.

***

### input

```ts
readonly input: Input;
```

Defined in: [packages/core/src/agent/loop.ts:150](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L150)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/loop.ts:148](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L148)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/loop.ts:162](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L162)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/loop.ts:156](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L156)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/loop.ts:161](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L161)

***

### middlewares?

```ts
readonly optional middlewares?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:169](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L169)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/loop.ts:147](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L147)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/agent/loop.ts:159](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L159)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonSchemaConverter;
```

Defined in: [packages/core/src/agent/loop.ts:160](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L160)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/loop.ts:153](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L153)

***

### resume?

```ts
readonly optional resume?: ResumeState;
```

Defined in: [packages/core/src/agent/loop.ts:158](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L158)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [packages/core/src/agent/loop.ts:157](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L157)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/loop.ts:154](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L154)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/loop.ts:155](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L155)

***

### tools

```ts
readonly tools: readonly AnyTool<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:149](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L149)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/loop.ts:152](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/loop.ts#L152)
