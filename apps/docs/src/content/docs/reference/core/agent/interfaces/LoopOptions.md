---
editUrl: false
next: false
prev: false
title: "LoopOptions"
---

Defined in: [packages/core/src/agent/loop.ts:139](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L139)

The full set of inputs to [agentLoop](/reference/core/agent/functions/agentloop/) — the flattened, already-resolved form of an
[AgentConfig](/reference/core/agent/interfaces/agentconfig/) plus per-run options.

## Remarks

This is the loop's low-level contract: [agent](/reference/core/agent/functions/agent/) assembles it from config + `RunOptions`.
`transport`/`providers`/`runtime` omitted fall back to environment BYOK, the model handle's provider,
and [defaultRuntime](/reference/core/agent/functions/defaultruntime/) respectively. `resume` drives the cross-process resume path; `output` +
`outputRetries` drive structured output. `maxSteps` defaults to 16, `outputRetries` to 2.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Deps` | the dependency object injected into tool/instruction contexts. |

## Properties

### consumers?

```ts
readonly optional consumers?: readonly EventConsumer[];
```

Defined in: [packages/core/src/agent/loop.ts:161](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L161)

***

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/agent/loop.ts:144](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L144)

***

### input

```ts
readonly input: Input;
```

Defined in: [packages/core/src/agent/loop.ts:143](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L143)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/loop.ts:141](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L141)

***

### loopDetection?

```ts
readonly optional loopDetection?: boolean;
```

Defined in: [packages/core/src/agent/loop.ts:155](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L155)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/loop.ts:157](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L157)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/loop.ts:149](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L149)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/loop.ts:156](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L156)

***

### middlewares?

```ts
readonly optional middlewares?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:160](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L160)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/loop.ts:140](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L140)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/agent/loop.ts:152](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L152)

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: [packages/core/src/agent/loop.ts:153](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L153)

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/loop.ts:146](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L146)

***

### repair?

```ts
readonly optional repair?: boolean;
```

Defined in: [packages/core/src/agent/loop.ts:158](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L158)

***

### resume?

```ts
readonly optional resume?: ResumeState;
```

Defined in: [packages/core/src/agent/loop.ts:151](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L151)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [packages/core/src/agent/loop.ts:150](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L150)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/loop.ts:147](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L147)

***

### selfCorrection?

```ts
readonly optional selfCorrection?: boolean;
```

Defined in: [packages/core/src/agent/loop.ts:159](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L159)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/loop.ts:148](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L148)

***

### toolRetries?

```ts
readonly optional toolRetries?: number;
```

Defined in: [packages/core/src/agent/loop.ts:154](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L154)

***

### tools

```ts
readonly tools: readonly AnyTool<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:142](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L142)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/loop.ts:145](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/loop.ts#L145)
