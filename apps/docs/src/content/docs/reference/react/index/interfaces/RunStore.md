---
editUrl: false
next: false
prev: false
title: "RunStore"
---

Defined in: index.ts:38

A `useSyncExternalStore`-compatible store over a run's events. Created by [createRunStore](/reference/react/index/functions/createrunstore/).

## Methods

### getSnapshot()

```ts
getSnapshot(): RunSnapshot;
```

Defined in: index.ts:42

Return the current [RunSnapshot](/reference/react/index/interfaces/runsnapshot/) (a stable reference between changes).

#### Returns

[`RunSnapshot`](/reference/react/index/interfaces/runsnapshot/)

***

### subscribe()

```ts
subscribe(onChange): () => void;
```

Defined in: index.ts:40

Register a change listener; returns an unsubscribe function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onChange` | () => `void` |

#### Returns

() => `void`
