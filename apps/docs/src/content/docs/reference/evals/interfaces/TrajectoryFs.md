---
editUrl: false
next: false
prev: false
title: "TrajectoryFs"
---

Defined in: [index.ts:296](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L296)

The minimal `FileSystem` surface [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) needs — satisfied by any `@mithril/fs` backend.

## Methods

### exists()

```ts
exists(path): Promise<boolean>;
```

Defined in: [index.ts:299](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L299)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`boolean`\>

***

### readText()

```ts
readText(path): Promise<string>;
```

Defined in: [index.ts:297](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L297)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`string`\>

***

### writeFile()

```ts
writeFile(path, data): Promise<void>;
```

Defined in: [index.ts:298](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/evals/src/index.ts#L298)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |

#### Returns

`Promise`\<`void`\>
