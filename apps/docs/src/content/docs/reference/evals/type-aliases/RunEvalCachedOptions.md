---
editUrl: false
next: false
prev: false
title: "RunEvalCachedOptions"
---

```ts
type RunEvalCachedOptions<Deps, Ctx> = RunEvalOptions<Deps, Ctx> & 
  | {
  mode: "live";
}
  | {
  mode: "record";
  store: TrajectoryStore;
}
  | {
  mode: "replay";
  store: TrajectoryStore;
};
```

Defined in: [index.ts:296](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L296)

Options for [runEvalCached](/reference/evals/functions/runevalcached/): the base [RunEvalOptions](/reference/evals/type-aliases/runevaloptions/) plus a discriminated cache `mode`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | - |
| `Ctx` | `void` |

## Remarks

- `"live"` — run the agent every time (no store), identical to [runEval](/reference/evals/functions/runeval/).
- `"record"` — run live once and write each case's trajectory to `store`, then score.
- `"replay"` — read each case's trajectory from `store` and score it **without running the agent**
  (deterministic, zero-network). A missing recording throws.
