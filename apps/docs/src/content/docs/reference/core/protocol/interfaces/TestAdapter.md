---
editUrl: false
next: false
prev: false
title: "TestAdapter"
---

Defined in: packages/core/src/protocol/checkpointer.ts:45

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

Defined in: packages/core/src/protocol/checkpointer.ts:47

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

Defined in: packages/core/src/protocol/checkpointer.ts:46

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
