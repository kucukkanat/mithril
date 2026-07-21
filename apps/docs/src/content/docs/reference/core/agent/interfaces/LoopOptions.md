---
editUrl: false
next: false
prev: false
title: "LoopOptions"
---

Defined in: packages/core/src/agent/loop.ts:134

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

Defined in: packages/core/src/agent/loop.ts:150

***

### deps

```ts
readonly deps: Deps;
```

Defined in: packages/core/src/agent/loop.ts:139

***

### input

```ts
readonly input: Input;
```

Defined in: packages/core/src/agent/loop.ts:138

***

### instructions

```ts
readonly instructions: string | ((ctx) => string | Promise<string>);
```

Defined in: packages/core/src/agent/loop.ts:136

***

### maxSteps?

```ts
readonly optional maxSteps?: number;
```

Defined in: packages/core/src/agent/loop.ts:144

***

### middlewares?

```ts
readonly optional middlewares?: readonly Middleware<Deps>[];
```

Defined in: packages/core/src/agent/loop.ts:149

***

### model

```ts
readonly model: ModelInput;
```

Defined in: packages/core/src/agent/loop.ts:135

***

### output?

```ts
readonly optional output?: StandardSchemaV1<unknown, JsonValue>;
```

Defined in: packages/core/src/agent/loop.ts:147

***

### outputRetries?

```ts
readonly optional outputRetries?: number;
```

Defined in: packages/core/src/agent/loop.ts:148

***

### providers?

```ts
readonly optional providers?: ProviderRegistry;
```

Defined in: packages/core/src/agent/loop.ts:141

***

### resume?

```ts
readonly optional resume?: ResumeState;
```

Defined in: packages/core/src/agent/loop.ts:146

***

### runId?

```ts
readonly optional runId?: string;
```

Defined in: packages/core/src/agent/loop.ts:145

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: packages/core/src/agent/loop.ts:142

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: packages/core/src/agent/loop.ts:143

***

### tools

```ts
readonly tools: readonly AnyTool<Deps>[];
```

Defined in: packages/core/src/agent/loop.ts:137

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: packages/core/src/agent/loop.ts:140
