---
editUrl: false
next: false
prev: false
title: "finalText"
---

```ts
function finalText(t): string;
```

Defined in: [index.ts:569](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L569)

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
