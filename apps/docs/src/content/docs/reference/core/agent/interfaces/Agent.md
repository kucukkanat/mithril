---
editUrl: false
next: false
prev: false
title: "Agent"
---

Defined in: [packages/core/src/agent/agent-types.ts:197](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L197)

A configured, runnable agent produced by [agent](/reference/core/agent/functions/agent/).

## Remarks

Methods:
- `run` drains the loop to a single terminal [RunResult](/reference/core/agent/type-aliases/runresult/).
- `stream` returns a [RunHandle](/reference/core/agent/interfaces/runhandle/) for incremental event/text consumption.
- `iterate` yields a [StepSnapshot](/reference/core/agent/interfaces/stepsnapshot/) at each step boundary for step-level control; abandoning the
  iterator (a `break`/`return`) cancels the run.
- `resume` continues any suspension from its `token` and a [ResumeValue](/reference/core/agent/type-aliases/resumevalue/) (an ApprovalDecision
  for Tier-1 approval, or `{ kind: "resolve", value }` for a Tier-1b/Tier-2 resolution). It returns the
  final [RunResult](/reference/core/agent/type-aliases/runresult/) and does not re-stream events.
- `resumeStream` is `resume`'s streaming form: it returns a [RunHandle](/reference/core/agent/interfaces/runhandle/) over the resumed run.
- `deps`/`tools`/`instructions` are always re-provided via the reconstructed agent and `opts`; nothing
  is deserialized into behavior.
- `__tools` is a phantom type carrier for UI-tool inference; it is erased at build and never populated.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | - | the tuple of tools available to the model. |
| `Deps` | - | the dependency object injected into each run. |
| `Out` *extends* [`JsonValue`](/reference/core/protocol/type-aliases/jsonvalue/) | `string` | the run output type ([RunResult](/reference/core/agent/type-aliases/runresult/)'s `output`). |

## Properties

### \_\_tools?

```ts
readonly optional __tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:205](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L205)

## Methods

### iterate()

```ts
iterate(input, ...opts): AsyncGenerator<StepSnapshot, RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:200](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L200)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`AsyncGenerator`\<[`StepSnapshot`](/reference/core/agent/interfaces/stepsnapshot/), [`RunResult`](/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### resume()

```ts
resume(
   token, 
   resolution, ...
opts): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:203](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L203)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |
| `resolution` | [`ResumeValue`](/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`Promise`\<[`RunResult`](/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### resumeStream()

```ts
resumeStream(
   token, 
   resolution, ...
opts): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:204](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L204)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |
| `resolution` | [`ResumeValue`](/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

[`RunHandle`](/reference/core/agent/interfaces/runhandle/)\<`Out`\>

***

### run()

```ts
run(input, ...opts): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:198](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L198)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`Promise`\<[`RunResult`](/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### stream()

```ts
stream(input, ...opts): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:199](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/agent/agent-types.ts#L199)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

[`RunHandle`](/reference/core/agent/interfaces/runhandle/)\<`Out`\>
