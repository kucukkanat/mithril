---
editUrl: false
next: false
prev: false
title: "healing"
---

```ts
const healing: {
  argRepair: <Deps>() => Middleware<Deps>;
  defaults: <Deps>() => readonly Middleware<Deps>[];
  harmonyRepair: <Deps>() => Middleware<Deps>;
  loopGuard: <Deps>(opts) => Middleware<Deps>;
  outputRetry: <Deps>(opts) => Middleware<Deps>;
  retryBudget: <Deps>(opts) => Middleware<Deps>;
};
```

Defined in: [packages/core/src/agent/healing.ts:335](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/healing.ts#L335)

The built-in self-healing middleware, as a namespace. Spread [healing.defaults](/mithril/reference/core/agent/variables/healing/#defaults) (the agent default)
or pick individual behaviors into an agent's `healing` field / a plugin's `use`.

## Type Declaration

### argRepair

```ts
argRepair: <Deps>() => Middleware<Deps>;
```

Tool-altitude repair: when a tool call fails schema validation because the model emitted the whole
arguments object as a JSON string (a common small-model slip), coerce it to the object, emit a visible
`tool.repair`, and re-run the call once. Any non-`invalid_args` failure, or an uncoercible input, is
left untouched for the model to see.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred; healing middleware are dependency-agnostic). |

#### Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>

### defaults

```ts
defaults: <Deps>() => readonly Middleware<Deps>[];
```

The default self-healing stack, installed by every agent unless its `healing` field overrides it. Order
matters: `argRepair` (tool) and `outputRetry` (finalize) act during a step, while `retryBudget` runs its
budget check before `loopGuard`'s no-progress check so an exhausted tool halts before loop detection fires.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred). |

#### Returns

readonly [`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>[]

### harmonyRepair

```ts
harmonyRepair: <Deps>() => Middleware<Deps>;
```

Model-altitude salvage: when the provider parsed NO tool calls but the model's text contains a leaked
tool call (its native tool grammar surfaced through the OpenAI-compat `content` channel instead of
`tool_calls` — e.g. gpt-oss "harmony" markers, or a stray `<tool_call>…</tool_call>` block), recover the
call, emit a visible `tool.repair` (`mechanism: "parse"`), and hand it back so the loop executes it. Only
names the agent actually exposes are salvaged, so a prose answer that merely mentions a tool is untouched.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | `unknown` | the agent's dependency bag (inferred; healing middleware are dependency-agnostic). |

#### Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>

### loopGuard

```ts
loopGuard: <Deps>(opts) => Middleware<Deps>;
```

Step-altitude no-progress guard: over identical `(tool, canonical-args)` signatures, the model is
steered once at `steerAt` (a `loop.detected` with `action: "steer"` plus an injected nudge), then the
run halts at `haltAt` with a typed `LoopDetected` error (`action: "halt"`). Catches the residual case of
identical calls that don't (or no longer) error — repeated *failing* calls are bounded by
[retryBudget](/mithril/reference/core/agent/functions/retrybudget/) first.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`LoopGuardOptions`](/mithril/reference/core/agent/interfaces/loopguardoptions/) | see [LoopGuardOptions](/mithril/reference/core/agent/interfaces/loopguardoptions/). `steerAt` defaults to 3, `haltAt` to 4. |

#### Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>

### outputRetry

```ts
outputRetry: <Deps>(opts) => Middleware<Deps>;
```

Finalize-altitude structured-output retry: when the model's final text fails the `output` schema, emit a
visible `object.invalid`, then either re-ask (steer the model with the failing issues plus the schema
hint) up to `max` times, or halt with a typed `OutputInvalid` error once the budget is spent. Only runs
for agents that declare an `output` schema.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`OutputRetryOptions`](/mithril/reference/core/agent/interfaces/outputretryoptions/) | see [OutputRetryOptions](/mithril/reference/core/agent/interfaces/outputretryoptions/). `max` defaults to 2. |

#### Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>

### retryBudget

```ts
retryBudget: <Deps>(opts) => Middleware<Deps>;
```

Step-altitude repair budget: a tool that keeps failing is re-asked (each failure emits `tool.retry`)
until it exhausts `max` consecutive failures with no success in between, at which point the run halts
with a clear `ToolRepairExhausted` terminal error instead of burning to `maxSteps`. Any success resets
that tool's counter.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`RetryBudgetOptions`](/mithril/reference/core/agent/interfaces/retrybudgetoptions/) | see [RetryBudgetOptions](/mithril/reference/core/agent/interfaces/retrybudgetoptions/). `max` defaults to 2; `max: 0` gives up on the first failure. |

#### Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>

## Example

```ts
import { agent, healing } from "@mithril/core/agent";

// raw loop except a stricter loop guard:
agent({ model, instructions, tools, healing: [healing.loopGuard({ haltAt: 3 })] });
```
