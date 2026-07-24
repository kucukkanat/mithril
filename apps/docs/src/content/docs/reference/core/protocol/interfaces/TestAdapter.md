---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: [packages/core/src/protocol/checkpointer.ts:85](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L85)

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

Defined in: [packages/core/src/protocol/checkpointer.ts:87](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L87)

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

Defined in: [packages/core/src/protocol/checkpointer.ts:86](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/protocol/checkpointer.ts#L86)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
