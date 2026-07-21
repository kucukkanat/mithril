---
editUrl: false
next: false
prev: false
title: "Workflow"
---

Defined in: packages/workflows/src/index.ts:25

A compiled workflow. Call [Workflow.run](/reference/workflows/interfaces/workflow/#run) with an initial state to execute it.

## Type Parameters

| Type Parameter |
| ------ |
| `S` |

## Methods

### run()

```ts
run(initial): Promise<{
  path: readonly string[];
  state: S;
}>;
```

Defined in: packages/workflows/src/index.ts:28

Run from the configured `start` step until a step returns `done`. Resolves with the final
state and the ordered `path` of visited step names.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `initial` | `S` |

#### Returns

`Promise`\<\{
  `path`: readonly `string`[];
  `state`: `S`;
\}\>
