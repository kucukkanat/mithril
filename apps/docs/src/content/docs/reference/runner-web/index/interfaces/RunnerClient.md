---
editUrl: false
next: false
prev: false
title: "RunnerClient"
---

Defined in: [runner-web/src/client.ts:53](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L53)

Owns the runner worker and exposes the run's accumulated state.

## Methods

### getSnapshot()

```ts
getSnapshot(): RunnerSnapshot;
```

Defined in: [runner-web/src/client.ts:56](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L56)

#### Returns

[`RunnerSnapshot`](/reference/runner-web/index/interfaces/runnersnapshot/)

***

### reset()

```ts
reset(): void;
```

Defined in: [runner-web/src/client.ts:67](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L67)

Terminate and clear back to the idle snapshot.

#### Returns

`void`

***

### resume()

```ts
resume(decision): void;
```

Defined in: [runner-web/src/client.ts:60](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L60)

Answer the pending suspension of the in-flight run.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `decision` | [`ResumeValue`](/reference/runner-web/index/type-aliases/resumevalue/) |

#### Returns

`void`

***

### run()

```ts
run(code, opts?): void;
```

Defined in: [runner-web/src/client.ts:58](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L58)

Terminate any in-flight run, then execute `code` in a fresh worker.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `string` |
| `opts?` | [`RunnerRunOptions`](/reference/runner-web/index/interfaces/runnerrunoptions/) |

#### Returns

`void`

***

### stop()

```ts
stop(): void;
```

Defined in: [runner-web/src/client.ts:65](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L65)

Terminate the in-flight run. Accumulated `events`/`logs` are kept, but `status` returns to `"idle"`
so subscribers leave the running state (a run already at `"done"`/`"error"` is untouched).

#### Returns

`void`

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [runner-web/src/client.ts:55](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/runner-web/src/client.ts#L55)

Subscribe to snapshot changes; returns an unsubscribe function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

() => `void`
