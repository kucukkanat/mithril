---
editUrl: false
next: false
prev: false
title: "Middleware"
---

Defined in: [packages/core/src/protocol/middleware.ts:93](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L93)

Producer-side composability: observe or transform a run purely by wrapping
model and tool invocations.

## Remarks

Middleware acts only through reading and emitting events (no private side
channel), so every extension stays replayable and inspectable. Three
altitudes wrap, from widest to narrowest: `step` (a whole model+tools step —
budgets, compaction, whole-step retry), `model` (one model call — caching,
fallback models), and `tool` (one tool call — guardrails, memoization, drift).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | The dependency bag shared with [MiddlewareContext](/reference/core/protocol/interfaces/middlewarecontext/). |

## Properties

### model?

```ts
optional model?: (ctx, call, next) => Promise<ModelResult>;
```

Defined in: [packages/core/src/protocol/middleware.ts:106](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L106)

Wrap a single model invocation (retries, caching, prompt-cache ordering, fallback models).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `call` | [`ModelCall`](/reference/core/protocol/interfaces/modelcall/) |
| `next` | (`c`) => `Promise`\<[`ModelResult`](/reference/core/protocol/interfaces/modelresult/)\> |

#### Returns

`Promise`\<[`ModelResult`](/reference/core/protocol/interfaces/modelresult/)\>

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:94](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L94)

***

### step?

```ts
optional step?: (ctx, input, next) => Promise<StepOutcome>;
```

Defined in: [packages/core/src/protocol/middleware.ts:100](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L100)

Wrap a whole step (its model call plus any tool execution). Runs outside `model`/`tool`. Short-circuit
by returning a [StepOutcome](/reference/core/protocol/interfaces/stepoutcome/) without calling `next` (skip the step); enforce a token/step budget by
inspecting `ctx` before `next` and aborting via `ctx.signal`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `input` | [`StepInput`](/reference/core/protocol/interfaces/stepinput/) |
| `next` | (`i`) => `Promise`\<[`StepOutcome`](/reference/core/protocol/interfaces/stepoutcome/)\> |

#### Returns

`Promise`\<[`StepOutcome`](/reference/core/protocol/interfaces/stepoutcome/)\>

***

### tool?

```ts
optional tool?: (ctx, call, next) => Promise<ToolOutcome>;
```

Defined in: [packages/core/src/protocol/middleware.ts:112](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/middleware.ts#L112)

Wrap a single tool invocation. Short-circuit by returning without calling `next` (cache hit / block).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `call` | [`ToolInvocation`](/reference/core/protocol/type-aliases/toolinvocation/) |
| `next` | (`c`) => `Promise`\<[`ToolOutcome`](/reference/core/protocol/type-aliases/tooloutcome/)\> |

#### Returns

`Promise`\<[`ToolOutcome`](/reference/core/protocol/type-aliases/tooloutcome/)\>
