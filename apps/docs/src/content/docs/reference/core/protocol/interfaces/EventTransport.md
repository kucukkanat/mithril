---
editUrl: false
next: false
prev: false
title: "EventTransport"
---

Defined in: packages/core/src/protocol/transport.ts:11

A gap-detecting, cross-runtime event bus built on web standards only.

## Remarks

`subscribe` returns an unsubscribe function. A `resumeFrom` seq lets a late
subscriber replay retained events before receiving live ones.

## Methods

### publish()

```ts
publish(e): void;
```

Defined in: packages/core/src/protocol/transport.ts:12

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `e` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) |

#### Returns

`void`

***

### subscribe()

```ts
subscribe(onEvent, resumeFrom?): () => void;
```

Defined in: packages/core/src/protocol/transport.ts:13

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onEvent` | (`e`) => `void` |
| `resumeFrom?` | `number` |

#### Returns

() => `void`
