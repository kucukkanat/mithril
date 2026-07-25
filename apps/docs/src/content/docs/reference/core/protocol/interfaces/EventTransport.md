---
editUrl: false
next: false
prev: false
title: "EventTransport"
---

Defined in: [packages/core/src/protocol/transport.ts:11](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/transport.ts#L11)

A gap-detecting, cross-runtime event bus built on web standards only.

## Remarks

`subscribe` returns an unsubscribe function. A `resumeFrom` seq lets a late
subscriber replay retained events before receiving live ones.

## Methods

### publish()

```ts
publish(e): void;
```

Defined in: [packages/core/src/protocol/transport.ts:12](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/transport.ts#L12)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `e` | [`MithrilEvent`](/mithril/reference/core/protocol/type-aliases/mithrilevent/) |

#### Returns

`void`

***

### subscribe()

```ts
subscribe(onEvent, resumeFrom?): () => void;
```

Defined in: [packages/core/src/protocol/transport.ts:13](https://github.com/kucukkanat/mithril/blob/a73570ce8bac19f4274cb0c8e4f6d2ec07331281/packages/core/src/protocol/transport.ts#L13)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onEvent` | (`e`) => `void` |
| `resumeFrom?` | `number` |

#### Returns

() => `void`
