---
editUrl: false
next: false
prev: false
title: "Middleware"
---

Defined in: [packages/core/src/protocol/middleware.ts:157](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L157)

Producer-side composability: observe or transform a run purely by wrapping
model and tool invocations.

## Remarks

Middleware acts only through reading and emitting events (no private side
channel), so every extension stays replayable and inspectable. Four
altitudes wrap, from widest to narrowest: `step` (a whole model+tools step —
budgets, compaction, whole-step retry, loop detection), `model` (one model
call — caching, fallback models), `tool` (one tool call — guardrails,
memoization, arg repair), and `finalize` (the structured-output validate step
— schema-retry). The built-in `healing.*` stack is nothing more than one
middleware per altitude.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | The dependency bag shared with [MiddlewareContext](/mithril/reference/core/protocol/interfaces/middlewarecontext/). |

## Properties

### finalize?

```ts
optional finalize?: (ctx, call, next) => Promise<FinalizeOutcome>;
```

Defined in: [packages/core/src/protocol/middleware.ts:188](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L188)

Wrap the structured-output finalize step (only runs when the agent has an `output` schema and the model
answered with no tool calls). On an `invalid` [FinalizeOutcome](/mithril/reference/core/protocol/type-aliases/finalizeoutcome/), re-ask by calling
[MiddlewareContext.steer](/mithril/reference/core/protocol/interfaces/middlewarecontext/#steer) (append `call.retryHint`) or give up with `halt`; emit `object.invalid`
yourself so the retry stays visible.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/mithril/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `call` | [`FinalizeCall`](/mithril/reference/core/protocol/interfaces/finalizecall/) |
| `next` | (`c`) => `Promise`\<[`FinalizeOutcome`](/mithril/reference/core/protocol/type-aliases/finalizeoutcome/)\> |

#### Returns

`Promise`\<[`FinalizeOutcome`](/mithril/reference/core/protocol/type-aliases/finalizeoutcome/)\>

***

### model?

```ts
optional model?: (ctx, call, next) => Promise<ModelResult>;
```

Defined in: [packages/core/src/protocol/middleware.ts:171](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L171)

Wrap a single model invocation (retries, caching, prompt-cache ordering, fallback models).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/mithril/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `call` | [`ModelCall`](/mithril/reference/core/protocol/interfaces/modelcall/) |
| `next` | (`c`) => `Promise`\<[`ModelResult`](/mithril/reference/core/protocol/interfaces/modelresult/)\> |

#### Returns

`Promise`\<[`ModelResult`](/mithril/reference/core/protocol/interfaces/modelresult/)\>

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:158](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L158)

***

### step?

```ts
optional step?: (ctx, input, next) => Promise<StepOutcome>;
```

Defined in: [packages/core/src/protocol/middleware.ts:165](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L165)

Wrap a whole step (its model call plus any tool execution). Runs outside `model`/`tool`. Short-circuit
by returning a [StepOutcome](/mithril/reference/core/protocol/interfaces/stepoutcome/) without calling `next` (skip the step); enforce a token/step budget by
inspecting `ctx` before `next` and aborting via `ctx.signal`. Read `next`'s [StepOutcome.toolOutcomes](/mithril/reference/core/protocol/interfaces/stepoutcome/#tooloutcomes)
to drive a retry budget or loop detection, steering/halting via [MiddlewareContext.steer](/mithril/reference/core/protocol/interfaces/middlewarecontext/#steer)/`halt`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/mithril/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `input` | [`StepInput`](/mithril/reference/core/protocol/interfaces/stepinput/) |
| `next` | (`i`) => `Promise`\<[`StepOutcome`](/mithril/reference/core/protocol/interfaces/stepoutcome/)\> |

#### Returns

`Promise`\<[`StepOutcome`](/mithril/reference/core/protocol/interfaces/stepoutcome/)\>

***

### tool?

```ts
optional tool?: (ctx, call, next) => Promise<ToolOutcome>;
```

Defined in: [packages/core/src/protocol/middleware.ts:177](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/protocol/middleware.ts#L177)

Wrap a single tool invocation. Short-circuit by returning without calling `next` (cache hit / block).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`MiddlewareContext`](/mithril/reference/core/protocol/interfaces/middlewarecontext/)\<`Deps`\> |
| `call` | [`ToolInvocation`](/mithril/reference/core/protocol/type-aliases/toolinvocation/) |
| `next` | (`c`) => `Promise`\<[`ToolOutcome`](/mithril/reference/core/protocol/type-aliases/tooloutcome/)\> |

#### Returns

`Promise`\<[`ToolOutcome`](/mithril/reference/core/protocol/type-aliases/tooloutcome/)\>
