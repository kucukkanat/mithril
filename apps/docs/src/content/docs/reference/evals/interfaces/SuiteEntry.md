---
editUrl: false
next: false
prev: false
title: "SuiteEntry"
---

Defined in: [index.ts:392](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L392)

One group of cases run against a specific agent in a [runSuite](/reference/evals/functions/runsuite/) matrix — e.g. one model, or one
agent configuration. The per-entry agent is what lets a suite vary instructions/toolset/model per group.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Deps` | - |
| `Ctx` | `void` |

## Properties

### agent

```ts
readonly agent: Agent<readonly AnyTool<Deps>[], Deps, JsonValue>;
```

Defined in: [index.ts:394](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L394)

***

### cases

```ts
readonly cases: readonly EvalCase<Ctx>[];
```

Defined in: [index.ts:395](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L395)

***

### label

```ts
readonly label: string;
```

Defined in: [index.ts:393](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L393)
