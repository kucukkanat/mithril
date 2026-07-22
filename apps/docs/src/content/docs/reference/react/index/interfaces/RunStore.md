---
editUrl: false
next: false
prev: false
title: "RunStore"
---

Defined in: [index.ts:38](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/react/src/index.ts#L38)

A `useSyncExternalStore`-compatible store over a run's events. Created by [createRunStore](/reference/react/index/functions/createrunstore/).

## Methods

### getSnapshot()

```ts
getSnapshot(): RunSnapshot;
```

Defined in: [index.ts:42](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/react/src/index.ts#L42)

Return the current [RunSnapshot](/reference/react/index/interfaces/runsnapshot/) (a stable reference between changes).

#### Returns

[`RunSnapshot`](/reference/react/index/interfaces/runsnapshot/)

***

### subscribe()

```ts
subscribe(onChange): () => void;
```

Defined in: [index.ts:40](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/react/src/index.ts#L40)

Register a change listener; returns an unsubscribe function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onChange` | () => `void` |

#### Returns

() => `void`
