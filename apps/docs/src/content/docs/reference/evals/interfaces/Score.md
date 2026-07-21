---
editUrl: false
next: false
prev: false
title: "Score"
---

Defined in: index.ts:33

A single scoring result produced by a [Scorer](/reference/evals/type-aliases/scorer/).

## Remarks

`value` is conventionally in the `0..1` range and compared against `RunEvalOptions.threshold`.
`rationale` is optional free-text explaining the score.

## Properties

### name

```ts
readonly name: string;
```

Defined in: index.ts:34

***

### rationale?

```ts
readonly optional rationale?: string;
```

Defined in: index.ts:36

***

### value

```ts
readonly value: number;
```

Defined in: index.ts:35
