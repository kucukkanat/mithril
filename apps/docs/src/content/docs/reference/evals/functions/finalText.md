---
editUrl: false
next: false
prev: false
title: "finalText"
---

```ts
function finalText(t): string;
```

Defined in: [index.ts:533](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L533)

Concatenate every `text.delta` in a trajectory into the assistant's final text output.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) | the [Trajectory](/reference/evals/interfaces/trajectory/) to read. |

## Returns

`string`

the joined assistant text (empty string if the run produced none).

## Remarks

The building block for text scorers ([outputIncludes](/reference/evals/functions/outputincludes/)/[outputMatches](/reference/evals/functions/outputmatches/)); exported so
custom scorers and reporters don't each re-fold the event log.
