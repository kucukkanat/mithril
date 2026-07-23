---
editUrl: false
next: false
prev: false
title: "UsageTotals"
---

Defined in: [packages/core/src/protocol/primitives.ts:57](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L57)

A running usage accumulator: a [UsageDelta](/reference/core/protocol/interfaces/usagedelta/) plus a completed-step count.

## Extends

- [`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/)

## Properties

### cacheRead

```ts
readonly cacheRead: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:49](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L49)

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`cacheRead`](/reference/core/protocol/interfaces/usagedelta/#cacheread)

***

### cacheWrite

```ts
readonly cacheWrite: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:50](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L50)

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`cacheWrite`](/reference/core/protocol/interfaces/usagedelta/#cachewrite)

***

### costMicroUsd

```ts
readonly costMicroUsd: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:53](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L53)

Cost in integer micro-USD — avoids float drift when summing thousands of deltas.

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`costMicroUsd`](/reference/core/protocol/interfaces/usagedelta/#costmicrousd)

***

### input

```ts
readonly input: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:47](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L47)

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`input`](/reference/core/protocol/interfaces/usagedelta/#input)

***

### output

```ts
readonly output: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:48](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L48)

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`output`](/reference/core/protocol/interfaces/usagedelta/#output)

***

### reasoning

```ts
readonly reasoning: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:51](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L51)

#### Inherited from

[`UsageDelta`](/reference/core/protocol/interfaces/usagedelta/).[`reasoning`](/reference/core/protocol/interfaces/usagedelta/#reasoning)

***

### steps

```ts
readonly steps: number;
```

Defined in: [packages/core/src/protocol/primitives.ts:59](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/primitives.ts#L59)

Number of completed steps; carried (not summed) by [addUsage](/reference/core/protocol/functions/addusage/).
