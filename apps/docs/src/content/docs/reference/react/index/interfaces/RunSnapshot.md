---
editUrl: false
next: false
prev: false
title: "RunSnapshot"
---

Defined in: [index.ts:24](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L24)

An immutable view of a run, recomputed on every event.

## Remarks

Shape: `{ state, text, status, events, costUsd }`.

## Properties

### costUsd

```ts
readonly costUsd: number;
```

Defined in: [index.ts:34](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L34)

Accumulated cost in US dollars (derived from `state.usage.costMicroUsd`).

***

### events

```ts
readonly events: readonly MithrilEvent[];
```

Defined in: [index.ts:32](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L32)

Every event received so far, in order.

***

### state

```ts
readonly state: RunState;
```

Defined in: [index.ts:26](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L26)

The full replayed RunState for the events seen so far.

***

### status

```ts
readonly status: RunStatus | "streaming";
```

Defined in: [index.ts:30](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L30)

`"streaming"` while events are still arriving; otherwise the terminal RunState.status.

***

### text

```ts
readonly text: string;
```

Defined in: [index.ts:28](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/react/src/index.ts#L28)

All `text.delta` chunks concatenated into the running output string.
