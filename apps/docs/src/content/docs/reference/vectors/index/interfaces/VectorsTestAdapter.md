---
editUrl: false
next: false
prev: false
title: "VectorsTestAdapter"
---

Defined in: [index.ts:127](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/vectors/src/index.ts#L127)

Minimal test-runner shim so [vectorsConformance](/reference/vectors/index/functions/vectorsconformance/) runs under bun:test / vitest with no hard dependency.

## Methods

### assertEqual()

```ts
assertEqual(actual, expected): void;
```

Defined in: [index.ts:129](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/vectors/src/index.ts#L129)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `actual` | `unknown` |
| `expected` | `unknown` |

#### Returns

`void`

***

### assertTrue()

```ts
assertTrue(value, message?): void;
```

Defined in: [index.ts:130](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/vectors/src/index.ts#L130)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `boolean` |
| `message?` | `string` |

#### Returns

`void`

***

### test()

```ts
test(name, fn): void;
```

Defined in: [index.ts:128](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/vectors/src/index.ts#L128)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
