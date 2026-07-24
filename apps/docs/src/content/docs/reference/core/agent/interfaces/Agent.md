---
editUrl: false
next: false
prev: false
title: "Agent"
---

Defined in: [packages/core/src/agent/agent-types.ts:206](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L206)

A configured, runnable agent produced by [agent](/mithril/reference/core/agent/functions/agent/).

## Remarks

Methods:
- `run` drains the loop to a single terminal [RunResult](/mithril/reference/core/agent/type-aliases/runresult/).
- `stream` returns a [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/) for incremental event/text consumption.
- `iterate` yields a [StepSnapshot](/mithril/reference/core/agent/interfaces/stepsnapshot/) at each step boundary for step-level control; abandoning the
  iterator (a `break`/`return`) cancels the run.
- `resume` continues any suspension from its `token` and a [ResumeValue](/mithril/reference/core/agent/type-aliases/resumevalue/) (an ApprovalDecision
  for Tier-1 approval, or `{ kind: "resolve", value }` for a Tier-1b/Tier-2 resolution). It returns the
  final [RunResult](/mithril/reference/core/agent/type-aliases/runresult/) and does not re-stream events.
- `resumeStream` is `resume`'s streaming form: it returns a [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/) over the resumed run.
- `resumeFrom` is the zero-glue durable counterpart: given a `runId` and a [ResumeValue](/mithril/reference/core/agent/type-aliases/resumevalue/), it loads
  that run's latest checkpoint from `opts.persistence` (unsealing via `open` when configured) and resumes
  it — no token handling. It throws [MithrilError](/mithril/reference/core/agent/classes/mithrilerror/) `CHECKPOINT_NOT_FOUND` / `NOT_SUSPENDED` when the
  run is unknown or not resumable, and `NO_PERSISTENCE` when `opts.persistence` is absent.
- `resumeStreamFrom` is `resumeFrom`'s streaming form: it returns a [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/).
- `deps`/`tools`/`instructions` are always re-provided via the reconstructed agent and `opts`; nothing
  is deserialized into behavior.
- `__tools` is a phantom type carrier for UI-tool inference; it is erased at build and never populated.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Tools` *extends* readonly [`AnyTool`](/mithril/reference/core/protocol/type-aliases/anytool/)\<`Deps`\>[] | - | the tuple of tools available to the model. |
| `Deps` | - | the dependency object injected into each run. |
| `Out` *extends* [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | `string` | the run output type ([RunResult](/mithril/reference/core/agent/type-aliases/runresult/)'s `output`). |

## Properties

### \_\_tools?

```ts
readonly optional __tools?: Tools;
```

Defined in: [packages/core/src/agent/agent-types.ts:217](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L217)

## Methods

### iterate()

```ts
iterate(input, ...opts): AsyncGenerator<StepSnapshot, RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:209](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L209)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/mithril/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`AsyncGenerator`\<[`StepSnapshot`](/mithril/reference/core/agent/interfaces/stepsnapshot/), [`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### resume()

```ts
resume(
   token, 
   resolution, ...
opts): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:212](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L212)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |
| `resolution` | [`ResumeValue`](/mithril/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`Promise`\<[`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### resumeFrom()

```ts
resumeFrom(
   runId, 
   resolution, ...
opts): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:215](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L215)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `resolution` | [`ResumeValue`](/mithril/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`Promise`\<[`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### resumeStream()

```ts
resumeStream(
   token, 
   resolution, ...
opts): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:213](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L213)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `string` |
| `resolution` | [`ResumeValue`](/mithril/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

[`RunHandle`](/mithril/reference/core/agent/interfaces/runhandle/)\<`Out`\>

***

### resumeStreamFrom()

```ts
resumeStreamFrom(
   runId, 
   resolution, ...
opts): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:216](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L216)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `resolution` | [`ResumeValue`](/mithril/reference/core/agent/type-aliases/resumevalue/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

[`RunHandle`](/mithril/reference/core/agent/interfaces/runhandle/)\<`Out`\>

***

### run()

```ts
run(input, ...opts): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:207](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L207)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/mithril/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

`Promise`\<[`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### stream()

```ts
stream(input, ...opts): RunHandle<Out>;
```

Defined in: [packages/core/src/agent/agent-types.ts:208](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/agent-types.ts#L208)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`Input`](/mithril/reference/core/agent/type-aliases/input/) |
| ...`opts` | [`RunArgs`](/mithril/reference/core/agent/type-aliases/runargs/)\<`Deps`\> |

#### Returns

[`RunHandle`](/mithril/reference/core/agent/interfaces/runhandle/)\<`Out`\>
