---
editUrl: false
next: false
prev: false
title: "LoopOptions"
---

Defined in: [packages/core/src/agent/loop.ts:245](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L245)

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

Defined in: [packages/core/src/agent/loop.ts:278](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L278)

***

### deps

```ts
readonly deps: Deps;
```

Defined in: [packages/core/src/agent/loop.ts:250](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L250)

***

### healing?

```ts
readonly optional healing?: 
  | false
  | readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:276](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L276)

The self-healing stack. Omitted ⇒ the batteries-included default ([healing.defaults](/mithril/reference/core/agent/variables/healing/#defaults)); `false`
or `[]` ⇒ a raw loop (crash-hardening still on); an array ⇒ exactly those healing middleware. Composed
ahead of `middlewares` so healing wraps user middleware.

***

### input

```ts
readonly input: Input;
```

Defined in: [packages/core/src/agent/loop.ts:249](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L249)

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: [packages/core/src/agent/loop.ts:247](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L247)

***

### materialize?

```ts
readonly optional materialize?: (def) => AnyTool<Deps>;
```

Defined in: [packages/core/src/agent/loop.ts:288](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L288)

Rebuilds a runtime tool from its [ToolDefinition](/mithril/reference/core/protocol/interfaces/tooldefinition/) when resuming. Supplied by whichever plugin
owns the definition `body` format; core never interprets a body itself.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `def` | [`ToolDefinition`](/mithril/reference/core/protocol/interfaces/tooldefinition/) |

#### Returns

[`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>

***

### maxConcurrentTools?

```ts
readonly optional maxConcurrentTools?: number;
```

Defined in: [packages/core/src/agent/loop.ts:270](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L270)

Max tool calls executed concurrently within one step (default DEFAULT\_TOOL\_CONCURRENCY). A model
that requests several independent tool calls in a turn runs them in a bounded pool instead of serially;
`1` restores strict sequential execution. Results still commit in call order, so the event stream and
message history are deterministic regardless of completion order.

***

### maxCostMicroUsd?

```ts
readonly optional maxCostMicroUsd?: number;
```

Defined in: [packages/core/src/agent/loop.ts:263](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L263)

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: [packages/core/src/agent/loop.ts:255](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L255)

***

### maxTokens?

```ts
readonly optional maxTokens?: number;
```

Defined in: [packages/core/src/agent/loop.ts:262](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L262)

***

### middlewares?

```ts
readonly optional middlewares?: readonly Middleware<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:277](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L277)

***

### model

```ts
readonly model: ModelInput;
```

Defined in: [packages/core/src/agent/loop.ts:246](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L246)

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: [packages/core/src/agent/loop.ts:260](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L260)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonSchemaConverter;
```

Defined in: [packages/core/src/agent/loop.ts:261](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L261)

***

### persistence?

```ts
readonly optional persistence?: Persistence;
```

Defined in: [packages/core/src/agent/loop.ts:259](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L259)

Opt-in durable persistence; present ⇒ [agentLoop](/mithril/reference/core/agent/functions/agentloop/) auto-checkpoints the run (terminal + suspend).

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: [packages/core/src/agent/loop.ts:252](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L252)

***

### resume?

```ts
readonly optional resume?: ResumeState;
```

Defined in: [packages/core/src/agent/loop.ts:257](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L257)

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: [packages/core/src/agent/loop.ts:256](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L256)

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: [packages/core/src/agent/loop.ts:253](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L253)

***

### setups?

```ts
readonly optional setups?: readonly PluginSetup<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:283](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L283)

Plugin `setup` hooks, run sequentially in `use` order once per run before step 0 (and again on
resume). `tools` is the registry's seed; a setup adds to it.

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [packages/core/src/agent/loop.ts:254](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L254)

***

### tools

```ts
readonly tools: readonly AnyTool<Deps>[];
```

Defined in: [packages/core/src/agent/loop.ts:248](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L248)

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: [packages/core/src/agent/loop.ts:251](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/agent/loop.ts#L251)
