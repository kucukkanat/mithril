---
editUrl: false
next: false
prev: false
title: "UsageDelta"
---

Defined in: packages/core/src/protocol/primitives.ts:46

Token counts and cost for a single accounting event.

## Extended by

- [`UsageTotals`](/reference/core/protocol/interfaces/usagetotals/)

## Properties

### cacheRead

```ts
readonly cacheRead: number;
```

Defined in: packages/core/src/protocol/primitives.ts:49

***

### cacheWrite

```ts
readonly cacheWrite: number;
```

Defined in: packages/core/src/protocol/primitives.ts:50

***

### costMicroUsd

```ts
readonly costMicroUsd: number;
```

Defined in: packages/core/src/protocol/primitives.ts:53

Cost in integer micro-USD — avoids float drift when summing thousands of deltas.

***

### input

```ts
readonly input: number;
```

Defined in: packages/core/src/protocol/primitives.ts:47

***

### output

```ts
readonly output: number;
```

Defined in: packages/core/src/protocol/primitives.ts:48

***

### reasoning

```ts
readonly reasoning: number;
```

Defined in: packages/core/src/protocol/primitives.ts:51
