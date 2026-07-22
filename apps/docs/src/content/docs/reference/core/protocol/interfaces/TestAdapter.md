---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: [packages/core/src/protocol/checkpointer.ts:45](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/checkpointer.ts#L45)

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

Defined in: [packages/core/src/protocol/checkpointer.ts:47](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/checkpointer.ts#L47)

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

Defined in: [packages/core/src/protocol/checkpointer.ts:46](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/core/src/protocol/checkpointer.ts#L46)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
