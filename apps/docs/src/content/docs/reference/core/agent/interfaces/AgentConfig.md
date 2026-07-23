---
editUrl: false
next: false
prev: false
title: "AgentConfig"
---

Defined in: [packages/core/src/agent/agent-types.ts:162](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L162)

The declarative configuration of an agent, passed to [agent](/reference/core/agent/functions/agent/) (or a harness-bound factory).

## Remarks

- `model` is a [ModelInput](/reference/core/protocol/type-aliases/modelinput/) (a self-wiring ModelHandle or a `provider/model` id).
- `instructions` may be a static string or a function of [RunContext](/reference/core/protocol/interfaces/runcontext/) (resolved per run).
- `maxSteps` defaults to 16; `outputRetries` defaults to 2; `toolRetries` defaults to 2.
- `output` opts into structured output: the final text is parsed and validated against the schema,
  retrying up to `outputRetries` times before failing.
- `toolRetries` bounds self-correction of a failing tool: after that many consecutive failures of the
  same tool (no success in between) the run ends with a clear terminal error rather than looping to
  `maxSteps`. Each failed attempt under budget emits a `tool.retry` event.
- `selfCorrection` is the master switch (default `true`): set it `false` for the raw loop — no arg
  coercion, no loop detection, and unbounded tool retries. Crash-hardening (a throwing provider/middleware
  becomes a typed `run.error`) is never disabled. `repair`, `loopDetection`, and `toolRetries` each
  override the master for their one feature, so `{ selfCorrection: false, loopDetection: true }` is a raw
  loop that still halts on identical-call loops.
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

Defined in: [packages/core/src/agent/agent-types.ts:164](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L164)

***

### loopDetection?

```ts
readonly optional loopDetection?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:170](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L170)

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:172](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L172)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:166](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L166)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:171](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L171)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/agent-types.ts:163](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L163)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:167](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L167)

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:168](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L168)

***

### repair?

```ts
readonly optional repair?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:173](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L173)

***

### selfCorrection?

```ts
readonly optional selfCorrection?: boolean;
```

Defined in: [packages/core/src/agent/agent-types.ts:174](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L174)

***

### toolRetries?

```ts
readonly optional toolRetries?: number;
```

Defined in: [packages/core/src/agent/agent-types.ts:169](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L169)

***

### tools?

```ts
readonly optional tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:165](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L165)

***

### use?

```ts
readonly optional use?: readonly (
  | Plugin<Deps, readonly AnyTool<Deps>[]>
  | Middleware<Deps>)[];
```

Defined in: [packages/core/src/agent/agent-types.ts:175](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/agent-types.ts#L175)
