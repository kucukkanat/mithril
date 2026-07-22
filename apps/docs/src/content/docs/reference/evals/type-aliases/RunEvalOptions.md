---
editUrl: false
next: false
prev: false
title: "RunEvalOptions"
---

```ts
type RunEvalOptions<Deps, Ctx> = DepsOption<Deps> & {
  makeContext?: (t) => Ctx | Promise<Ctx>;
  runtime?: RuntimeAdapter;
  threshold?: number;
  transport?: Transport;
};
```

Defined in: [index.ts:81](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L81)

Options controlling how [runEval](/reference/evals/functions/runeval/) / [describeEval](/reference/evals/functions/describeeval/) execute and score cases.

## Type Declaration

### makeContext?

```ts
readonly optional makeContext?: (t) => Ctx | Promise<Ctx>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `t` | [`Trajectory`](/reference/evals/interfaces/trajectory/) |

#### Returns

`Ctx` \| `Promise`\<`Ctx`\>

### runtime?

```ts
readonly optional runtime?: RuntimeAdapter;
```

### threshold?

```ts
readonly optional threshold?: number;
```

### transport?

```ts
readonly optional transport?: Transport;
```

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | - | The agent's dependency-injection type, passed through as `RunOptions.deps`. |
| `Ctx` | `void` | Per-run scorer context type. |

## Remarks

`transport` and `runtime` override the agent's defaults when present. `makeContext` derives the [Ctx](/reference/evals/type-aliases/runevaloptions/#ctx)
value handed to each [Scorer](/reference/evals/type-aliases/scorer/) from the trajectory. `threshold` is the minimum passing score and
defaults to `1`.
