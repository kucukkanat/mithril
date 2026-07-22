---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: [packages/core/src/protocol/checkpointer.ts:45](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/checkpointer.ts#L45)

A tiny test-runner bridge so the conformance kit runs under `bun:test` or
`vitest` without depending on either.

## Methods

### assertEqual()

```ts
assertEqual(
   actual, 
   expected, 
   message?): void;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:47](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/checkpointer.ts#L47)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `actual` | `unknown` |
| `expected` | `unknown` |
| `message?` | `string` |

#### Returns

`void`

***

### test()

```ts
test(name, fn): void;
```

Defined in: [packages/core/src/protocol/checkpointer.ts:46](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/checkpointer.ts#L46)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
