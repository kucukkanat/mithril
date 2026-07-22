---
editUrl: false
next: false
prev: false
title: "describeEval"
---

```ts
function describeEval<Deps, Ctx>(
   register, 
   agent, 
   cases, ...
   args): void;
```

Defined in: [index.ts:365](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L365)

Registers one host test per [EvalCase](/reference/evals/interfaces/evalcase/) against a `test`-shaped function (bun:test / vitest).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | - | The agent's dependency type. |
| `Ctx` | `void` | Per-run scorer context type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `register` | (`name`, `fn`) => `void` | The host runner's test registrar, e.g. bun:test's `test` — called as `register(name, fn)` once per case. |
| `agent` | `Agent`\<readonly `AnyTool`\<`Deps`\>[], `Deps`, `JsonValue`\> | The agent under test. |
| `cases` | readonly [`EvalCase`](/reference/evals/interfaces/evalcase/)\<`Ctx`\>[] | The evaluation cases to register. |
| ...`args` | [`EvalArgs`](/reference/evals/type-aliases/evalargs/)\<`Deps`, `Ctx`\> | - |

## Returns

`void`

## Throws

Inside each registered test, throws an `Error` listing the failing `name=value` scores when a case
  does not pass.

## Remarks

Thin wrapper over [runEval](/reference/evals/functions/runeval/) that turns each case into a test which fails on a sub-threshold
score.

## Example

```ts
import { test } from "bun:test";
describeEval(test, agent, cases, { deps });
```
