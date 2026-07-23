---
editUrl: false
next: false
prev: false
title: "SuiteEntry"
---

Defined in: [index.ts:428](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L428)

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

Defined in: [index.ts:430](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L430)

***

### cases

```ts
readonly cases: readonly EvalCase<Ctx>[];
```

Defined in: [index.ts:431](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L431)

***

### label

```ts
readonly label: string;
```

Defined in: [index.ts:429](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L429)
