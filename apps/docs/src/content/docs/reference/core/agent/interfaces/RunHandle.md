---
editUrl: false
next: false
prev: false
title: "RunHandle"
---

Defined in: [packages/core/src/agent/agent-types.ts:117](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L117)

A live handle over a streaming run, returned by [Agent.stream](/mithril/reference/core/agent/interfaces/agent/#stream).

## Remarks

Members:
- iterating the handle itself (it is `AsyncIterable<MithrilEvent>`) or `events` yields every
  [MithrilEvent](/mithril/reference/core/protocol/type-aliases/mithrilevent/) from a buffered broadcast — each iterator gets the full stream.
- `text` yields only assistant `text.delta` payloads as strings.
- `state()` returns a [RunState](/mithril/reference/core/protocol/interfaces/runstate/) replay of the events buffered so far.
- `result()` resolves with the terminal [RunResult](/mithril/reference/core/agent/type-aliases/runresult/) when the run ends.
- `cancel()` aborts the run at the next step boundary (or mid-provider-stream); `result()` then
  resolves `"cancelled"`. Equivalent to aborting RunOptions.signal.
- `resolve()` continues an in-process suspension by streaming the resumed run as a fresh
  [RunHandle](/mithril/reference/core/agent/interfaces/runhandle/) — no token round-trip. Rejects if the run did not suspend.

## Extends

- `AsyncIterable`\<[`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/)\>

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Out` | the run's output type, resolved by [RunHandle.result](/mithril/reference/core/agent/interfaces/runhandle/#result). |

## Properties

### events

```ts
readonly events: AsyncIterable<MithrilEvent>;
```

Defined in: [packages/core/src/agent/agent-types.ts:119](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L119)

***

### runId

```ts
readonly runId: string;
```

Defined in: [packages/core/src/agent/agent-types.ts:118](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L118)

***

### text

```ts
readonly text: AsyncIterable<string>;
```

Defined in: [packages/core/src/agent/agent-types.ts:120](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L120)

## Methods

### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<MithrilEvent, any, any>;
```

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es2018.asynciterable.d.ts:38

#### Returns

`AsyncIterator`\<[`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/), `any`, `any`\>

#### Inherited from

```ts
AsyncIterable.[asyncIterator]
```

***

### cancel()

```ts
cancel(reason?): void;
```

Defined in: [packages/core/src/agent/agent-types.ts:123](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L123)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `string` |

#### Returns

`void`

***

### resolve()

```ts
resolve(resolution): Promise<RunHandle<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:125](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L125)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resolution` | [`ResumeValue`](/mithril/reference/core/agent/type-aliases/resumevalue/) |

#### Returns

`Promise`\<`RunHandle`\<`Out`\>\>

***

### result()

```ts
result(): Promise<RunResult<Out>>;
```

Defined in: [packages/core/src/agent/agent-types.ts:122](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L122)

#### Returns

`Promise`\<[`RunResult`](/mithril/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### state()

```ts
state(): RunState;
```

Defined in: [packages/core/src/agent/agent-types.ts:121](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/core/src/agent/agent-types.ts#L121)

#### Returns

[`RunState`](/mithril/reference/core/protocol/interfaces/runstate/)
