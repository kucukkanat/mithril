---
editUrl: false
next: false
prev: false
title: "RunEvalOptions"
---

Defined in: index.ts:80

Options controlling how [runEval](/reference/evals/functions/runeval/) / [describeEval](/reference/evals/functions/describeeval/) execute and score cases.

## Remarks

`transport` and `runtime` override the agent's defaults when present. `makeContext` derives the [Ctx](/reference/evals/interfaces/runevaloptions/#ctx)
value handed to each [Scorer](/reference/evals/type-aliases/scorer/) from the trajectory. `threshold` is the minimum passing score and
defaults to `1`.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | - | The agent's dependency-injection type, passed through as `RunOptions.deps`. |
| `Ctx` | `void` | Per-run scorer context type. |

## Properties

### deps

```ts
readonly deps: Deps;
```

Defined in: index.ts:81

***

### makeContext?

```ts
readonly optional makeContext?: (t) => Ctx | Promise<Ctx>;
```

Defined in: index.ts:84

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) |

#### Returns

`Ctx` \| `Promise`\<`Ctx`\>

***

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

Defined in: index.ts:83

***

### threshold?

```ts
readonly optional threshold?: number;
```

Defined in: index.ts:85

***

### transport?

```ts
readonly optional transport?: Transport;
```

Defined in: index.ts:82
