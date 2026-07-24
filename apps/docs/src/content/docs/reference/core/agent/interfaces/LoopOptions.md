---
editUrl: false
next: false
prev: false
title: "LoopOptions"
---

Defined in: [packages/core/src/agent/loop.ts:191](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L191)

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

Defined in: [packages/core/src/agent/loop.ts:217](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L217)

***

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/agent/loop.ts:196](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L196)

***

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:215](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L215)

The self-healing stack. Omitted ⇒ the batteries-included default ([healing.defaults](/mithril/reference/core/agent/variables/healing/#defaults)); `false`
or `[]` ⇒ a raw loop (crash-hardening still on); an array ⇒ exactly those healing middleware. Composed
ahead of `middlewares` so healing wraps user middleware.

***

### input

```ts
readonly input: Input;
```

Defined in: [packages/core/src/agent/loop.ts:195](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L195)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/loop.ts:193](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L193)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/loop.ts:209](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L209)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/loop.ts:201](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L201)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/loop.ts:208](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L208)

***

### middlewares?

```ts
readonly optional middlewares?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:216](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L216)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/loop.ts:192](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L192)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/agent/loop.ts:206](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L206)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonSchemaConverter;
```

Defined in: [packages/core/src/agent/loop.ts:207](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L207)

***

### persistence?

```ts
readonly optional persistence?: Persistence;
```

Defined in: [packages/core/src/agent/loop.ts:205](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L205)

Opt-in durable persistence; present ⇒ [agentLoop](/mithril/reference/core/agent/functions/agentloop/) auto-checkpoints the run (terminal + suspend).

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/loop.ts:198](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L198)

***

### resume?

```ts
readonly optional resume?: ResumeState;
```

Defined in: [packages/core/src/agent/loop.ts:203](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L203)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [packages/core/src/agent/loop.ts:202](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L202)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/loop.ts:199](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L199)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/loop.ts:200](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L200)

***

### tools

```ts
readonly tools: readonly AnyTool<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:194](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L194)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/loop.ts:197](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/loop.ts#L197)
