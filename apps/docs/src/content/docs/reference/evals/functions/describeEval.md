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
   cases, 
   opts): void;
```

Defined in: index.ts:296

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
| `opts` | [`RunEvalOptions`](/reference/evals/interfaces/runevaloptions/)\<`Deps`, `Ctx`\> | [RunEvalOptions](/reference/evals/interfaces/runevaloptions/); the same `threshold` gates each registered test. |

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
