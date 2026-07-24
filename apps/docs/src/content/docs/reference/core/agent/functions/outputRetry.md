---
editUrl: false
next: false
prev: false
title: "outputRetry"
---

```ts
function outputRetry<Deps>(opts?): Middleware<Deps>;
```

Defined in: [packages/core/src/agent/healing.ts:312](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/healing.ts#L312)

Finalize-altitude structured-output retry: when the model's final text fails the `output` schema, emit a
visible `object.invalid`, then either re-ask (steer the model with the failing issues plus the schema
hint) up to `max` times, or halt with a typed `OutputInvalid` error once the budget is spent. Only runs
for agents that declare an `output` schema.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`OutputRetryOptions`](/mithril/reference/core/agent/interfaces/outputretryoptions/) | see [OutputRetryOptions](/mithril/reference/core/agent/interfaces/outputretryoptions/). `max` defaults to 2. |

## Returns

[`Middleware`](/mithril/reference/core/protocol/interfaces/middleware/)\<`Deps`\>
