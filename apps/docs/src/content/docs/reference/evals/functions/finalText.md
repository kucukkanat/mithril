---
editUrl: false
next: false
prev: false
title: "finalText"
---

```ts
function finalText(t): string;
```

Defined in: [index.ts:533](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/evals/src/index.ts#L533)

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
