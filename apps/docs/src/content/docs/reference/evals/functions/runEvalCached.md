---
editUrl: false
next: false
prev: false
title: "runEvalCached"
---

```ts
function runEvalCached<Deps, Ctx>(
   agent, 
   cases, 
opts): AsyncGenerator<EvalRun>;
```

Defined in: [index.ts:320](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L320)

Evaluate cases with a record-once / replay-from-file cache, yielding one [EvalRun](/reference/evals/interfaces/evalrun/) per case.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Deps` | - | the agent's dependency type. |
| `Ctx` | `void` | per-run scorer context type. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agent` | `Agent`\<readonly `AnyTool`\<`Deps`\>[], `Deps`, `JsonValue`\> | the agent under test (used in `"live"`/`"record"`, ignored in `"replay"`). |
| `cases` | readonly [`EvalCase`](/reference/evals/interfaces/evalcase/)\<`Ctx`\>[] | the cases to evaluate. |
| `opts` | [`RunEvalCachedOptions`](/reference/evals/type-aliases/runevalcachedoptions/)\<`Deps`, `Ctx`\> | [RunEvalCachedOptions](/reference/evals/type-aliases/runevalcachedoptions/) selecting the cache `mode` and (for record/replay) the `store`. |

## Returns

`AsyncGenerator`\<[`EvalRun`](/reference/evals/interfaces/evalrun/)\>

an async generator of [EvalRun](/reference/evals/interfaces/evalrun/).

## Throws

in `"replay"` mode, an `Error` when a case has no stored trajectory (record it first).

## Remarks

Replay re-emits the recorded log wholesale — tools never re-run and no provider is called — so
scoring is a pure, deterministic function of the fixture. Record and replay share the same case keys.

## Example

```ts
const store = fsTrajectoryStore(nodeFileSystem("./fixtures"));
// record once (hits the model):
for await (const _ of runEvalCached(agent, cases, { deps, mode: "record", store })) {}
// replay in CI (no network, deterministic):
for await (const run of runEvalCached(agent, cases, { deps, mode: "replay", store })) console.log(run.passed);
```
