---
editUrl: false
next: false
prev: false
title: "ContextMeter"
---

Defined in: [packages/devtools/src/selectors.ts:122](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L122)

A projection of a run's accounting for the inspector's cost/context meters.

## Properties

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: [packages/devtools/src/selectors.ts:129](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L129)

The model's context window, when supplied — enables the fill bar.

***

### cost

```ts
readonly cost: number;
```

Defined in: [packages/devtools/src/selectors.ts:126](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L126)

Accumulated cost in USD (`usage.costMicroUsd / 1e6`).

***

### pct?

```ts
readonly optional pct?: number;
```

Defined in: [packages/devtools/src/selectors.ts:131](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L131)

`tokens / contextWindow * 100`, when `contextWindow` is supplied.

***

### steps

```ts
readonly steps: number;
```

Defined in: [packages/devtools/src/selectors.ts:127](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L127)

***

### tokens

```ts
readonly tokens: number;
```

Defined in: [packages/devtools/src/selectors.ts:124](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/devtools/src/selectors.ts#L124)

Total billed tokens so far (`input + output + cacheRead + cacheWrite + reasoning`).
