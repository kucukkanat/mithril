---
editUrl: false
next: false
prev: false
title: "ResumeState"
---

Defined in: [packages/core/src/agent/loop.ts:78](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L78)

The reconstructed loop state driving a resume, assembled by [agent](/reference/core/agent/functions/agent/) from a run token.

## Properties

### messages

```ts
readonly messages: readonly LoopMessage[];
```

Defined in: [packages/core/src/agent/loop.ts:79](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L79)

***

### pending

```ts
readonly pending: PendingSuspension;
```

Defined in: [packages/core/src/agent/loop.ts:82](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L82)

***

### resolution

```ts
readonly resolution: ResumeValue;
```

Defined in: [packages/core/src/agent/loop.ts:83](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L83)

***

### step

```ts
readonly step: number;
```

Defined in: [packages/core/src/agent/loop.ts:81](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L81)

***

### usage

```ts
readonly usage: UsageTotals;
```

Defined in: [packages/core/src/agent/loop.ts:80](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/agent/loop.ts#L80)
