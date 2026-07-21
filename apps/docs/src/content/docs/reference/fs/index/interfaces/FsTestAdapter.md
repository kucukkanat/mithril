---
editUrl: false
next: false
prev: false
title: "FsTestAdapter"
---

Defined in: packages/fs/src/index.ts:151

Test-runner adapter that lets [fileSystemConformance](/reference/fs/index/functions/filesystemconformance/) run under any framework.

## Remarks

Implement this by delegating to your runner (e.g. Bun's `test` / `expect`) so the shared
suite stays framework-agnostic.

## Methods

### assertEqual()

```ts
assertEqual(actual, expected): void;
```

Defined in: packages/fs/src/index.ts:155

Assert deep equality of `actual` and `expected`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `actual` | `unknown` |
| `expected` | `unknown` |

#### Returns

`void`

***

### assertThrowsAsync()

```ts
assertThrowsAsync(fn): Promise<void>;
```

Defined in: packages/fs/src/index.ts:157

Assert that awaiting `fn` rejects.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | () => `Promise`\<`unknown`\> |

#### Returns

`Promise`\<`void`\>

***

### test()

```ts
test(name, fn): void;
```

Defined in: packages/fs/src/index.ts:153

Register a named test case.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`void`
