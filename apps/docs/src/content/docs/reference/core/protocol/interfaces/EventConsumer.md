---
editUrl: false
next: false
prev: false
title: "EventConsumer"
---

Defined in: [packages/core/src/protocol/middleware.ts:120](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L120)

A passive observer that receives every [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/) in order.

## Properties

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/middleware.ts:121](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L121)

## Methods

### onEvent()

```ts
onEvent(e): void;
```

Defined in: [packages/core/src/protocol/middleware.ts:122](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/middleware.ts#L122)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `e` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) |

#### Returns

`void`
