---
editUrl: false
next: false
prev: false
title: "createRunStore"
---

```ts
function createRunStore(source): RunStore;
```

Defined in: [index.ts:70](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/react/src/index.ts#L70)

Build a framework-agnostic [RunStore](/reference/react/index/interfaces/runstore/) that folds an event stream into a live [RunSnapshot](/reference/react/index/interfaces/runsnapshot/).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`MithrilEvent`\> | The run's event stream (e.g. a `RunHandle`'s `.events`). |

## Returns

[`RunStore`](/reference/react/index/interfaces/runstore/)

A store exposing `subscribe` and `getSnapshot`.

## Remarks

Immediately begins consuming `source`, recomputing the snapshot and notifying subscribers on each event;
`status` flips off `"streaming"` once the stream ends. This is the DOM-free core that useRun
wraps — pass the `.events` iterable directly (e.g. `createRunStore(handle.events)`).
