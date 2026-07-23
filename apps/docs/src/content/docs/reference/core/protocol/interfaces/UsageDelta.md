---
editUrl: false
next: false
prev: false
title: "UsageDelta"
---

Defined in: [packages/core/src/protocol/primitives.ts:46](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L46)

Token counts and cost for a single accounting event.

## Extended by

- [`UsageTotals`](/reference/core/protocol/interfaces/usagetotals/)

## Properties

### cacheRead

```ts
readonly cacheRead: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:49](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L49)

***

### cacheWrite

```ts
readonly cacheWrite: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:50](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L50)

***

### costMicroUsd

```ts
readonly costMicroUsd: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:53](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L53)

Cost in integer micro-USD — avoids float drift when summing thousands of deltas.

***

### input

```ts
readonly input: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:47](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L47)

***

### output

```ts
readonly output: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:48](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L48)

***

### reasoning

```ts
readonly reasoning: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:51](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/primitives.ts#L51)
