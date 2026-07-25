---
editUrl: false
next: false
prev: false
title: "ContextMeter"
---

Defined in: [packages/devtools/src/selectors.ts:126](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L126)

A projection of a run's accounting for the inspector's cost/context meters.

## Properties

### contextWindow?

```ts
readonly optional contextWindow?: number;
```

Defined in: [packages/devtools/src/selectors.ts:133](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L133)

The model's context window, when supplied — enables the fill bar.

***

### cost

```ts
readonly cost: number;
```

Defined in: [packages/devtools/src/selectors.ts:130](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L130)

Accumulated cost in USD (`usage.costMicroUsd / 1e6`).

***

### pct?

```ts
readonly optional pct?: number;
```

Defined in: [packages/devtools/src/selectors.ts:135](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L135)

`tokens / contextWindow * 100`, when `contextWindow` is supplied.

***

### steps

```ts
readonly steps: number;
```

Defined in: [packages/devtools/src/selectors.ts:131](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L131)

***

### tokens

```ts
readonly tokens: number;
```

Defined in: [packages/devtools/src/selectors.ts:128](https://github.com/kucukkanat/mithril/blob/1e1588b814f302666212314c3d2253f86a5155e3/packages/devtools/src/selectors.ts#L128)

Total billed tokens so far (`input + output + cacheRead + cacheWrite + reasoning`).
