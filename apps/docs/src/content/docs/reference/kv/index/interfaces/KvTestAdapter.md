---
editUrl: false
next: false
prev: false
title: "KvTestAdapter"
---

Defined in: [index.ts:93](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/kv/src/index.ts#L93)

Minimal test-runner shim that lets [kvConformance](/mithril/reference/kv/index/functions/kvconformance/) register cases against bun:test / vitest without
a hard dependency on either.

## Methods

### assertEqual()

```ts
assertEqual(actual, expected): void;
```

Defined in: [index.ts:97](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/kv/src/index.ts#L97)

Asserts deep equality of `actual` and `expected`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `actual` | `unknown` |
| `expected` | `unknown` |

#### Returns

`void`

***

### test()

```ts
test(name, fn): void;
```

Defined in: [index.ts:95](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/kv/src/index.ts#L95)

Registers a named test, mirroring bun:test / vitest's `test(name, fn)`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
