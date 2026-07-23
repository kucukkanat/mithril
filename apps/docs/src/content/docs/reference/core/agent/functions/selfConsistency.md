---
editUrl: false
next: false
prev: false
title: "selfConsistency"
---

```ts
function selfConsistency(opts): Middleware;
```

Defined in: [packages/core/src/agent/test-time.ts:41](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/core/src/agent/test-time.ts#L41)

Self-consistency: sample the model `n` times and return the majority answer (Wang et al.).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | [`SelfConsistencyOptions`](/reference/core/agent/interfaces/selfconsistencyoptions/) | the sample count and optional early-stop agreement threshold. |

## Returns

[`Middleware`](/reference/core/protocol/interfaces/middleware/)

a model-altitude [Middleware](/reference/core/protocol/interfaces/middleware/) to pass in an agent's `use` array.

## Remarks

Votes by canonical equality of the result's tool calls (name + validated-shape args) or, for a
text answer, its trimmed text — so it needs no answer-extraction heuristics. Emits `custom.selfConsistency`
per sample and for the winner. Cost is up to `n`× per model turn; the beats-critique-loops result makes
this the right "think harder" primitive, but it is opt-in because of that cost.

## Example

```ts
import { agent } from "@mithril/core/agent";
import { selfConsistency } from "@mithril/core/agent";

const a = agent({ model, instructions, tools, use: [selfConsistency({ n: 5, earlyStopAgreement: 3 })] });
```
