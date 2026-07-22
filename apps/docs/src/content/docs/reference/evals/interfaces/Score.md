---
editUrl: false
next: false
prev: false
title: "Score"
---

Defined in: [index.ts:34](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L34)

A single scoring result produced by a [Scorer](/reference/evals/type-aliases/scorer/).

## Remarks

`value` is conventionally in the `0..1` range and compared against `RunEvalOptions.threshold`.
`rationale` is optional free-text explaining the score.

## Properties

### name

```ts
readonly name: string;
```

Defined in: [index.ts:35](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L35)

***

### rationale?

```ts
readonly optional rationale?: string;
```

Defined in: [index.ts:37](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L37)

***

### value

```ts
readonly value: number;
```

Defined in: [index.ts:36](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L36)
