---
editUrl: false
next: false
prev: false
title: "EvalCase"
---

Defined in: [index.ts:52](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L52)

One evaluation case: a named input paired with the [Scorer](/reference/evals/type-aliases/scorer/)s to apply to its resulting trajectory.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Ctx` | `void` | Context type threaded to each [Scorer](/reference/evals/type-aliases/scorer/). |

## Properties

### input

```ts
readonly input: Input;
```

Defined in: [index.ts:54](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L54)

***

### name

```ts
readonly name: string;
```

Defined in: [index.ts:53](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L53)

***

### scorers

```ts
readonly scorers: readonly Scorer<Ctx>[];
```

Defined in: [index.ts:55](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L55)
