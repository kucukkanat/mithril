---
editUrl: false
next: false
prev: false
title: "RunHandle"
---

Defined in: packages/core/src/agent/agent-types.ts:98

A live handle over a streaming run, returned by [Agent.stream](/reference/core/agent/interfaces/agent/#stream).

## Remarks

Members:
- iterating the handle itself (it is `AsyncIterable<MithrilEvent>`) or `events` yields every
  [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/) from a buffered broadcast — each iterator gets the full stream.
- `text` yields only assistant `text.delta` payloads as strings.
- `state()` returns a [RunState](/reference/core/protocol/interfaces/runstate/) replay of the events buffered so far.
- `result()` resolves with the terminal [RunResult](/reference/core/agent/type-aliases/runresult/) when the run ends.
- `cancel()` aborts the run at the next step boundary (or mid-provider-stream); `result()` then
  resolves `"cancelled"`. Equivalent to aborting [RunOptions.signal](/reference/core/agent/interfaces/runoptions/#signal).
- `resolve()` continues an in-process suspension by streaming the resumed run as a fresh
  [RunHandle](/reference/core/agent/interfaces/runhandle/) — no token round-trip. Rejects if the run did not suspend.

## Extends

- `AsyncIterable`\<[`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/)\>

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Out` | the run's output type, resolved by [RunHandle.result](/reference/core/agent/interfaces/runhandle/#result). |

## Properties

### events

```ts
readonly events: AsyncIterable<MithrilEvent>;
```

Defined in: packages/core/src/agent/agent-types.ts:100

***

### runId

```ts
readonly runId: string;
```

Defined in: packages/core/src/agent/agent-types.ts:99

***

### text

```ts
readonly text: AsyncIterable<string>;
```

Defined in: packages/core/src/agent/agent-types.ts:101

## Methods

### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<MithrilEvent, any, any>;
```

Defined in: node\_modules/.bun/typescript@5.9.3/node\_modules/typescript/lib/lib.es2018.asynciterable.d.ts:38

#### Returns

`AsyncIterator`\<[`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/), `any`, `any`\>

#### Inherited from

```ts
AsyncIterable.[asyncIterator]
```

***

### cancel()

```ts
cancel(reason?): void;
```

Defined in: packages/core/src/agent/agent-types.ts:104

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

Defined in: packages/core/src/agent/agent-types.ts:106

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `resolution` | [`ResumeValue`](/reference/core/agent/type-aliases/resumevalue/) |

#### Returns

`Promise`\<`RunHandle`\<`Out`\>\>

***

### result()

```ts
result(): Promise<RunResult<Out>>;
```

Defined in: packages/core/src/agent/agent-types.ts:103

#### Returns

`Promise`\<[`RunResult`](/reference/core/agent/type-aliases/runresult/)\<`Out`\>\>

***

### state()

```ts
state(): RunState;
```

Defined in: packages/core/src/agent/agent-types.ts:102

#### Returns

[`RunState`](/reference/core/protocol/interfaces/runstate/)
