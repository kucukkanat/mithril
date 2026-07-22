---
editUrl: false
next: false
prev: false
title: "TrajectoryFs"
---

Defined in: [index.ts:260](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L260)

The minimal `FileSystem` surface [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) needs — satisfied by any `@mithril/fs` backend.

## Methods

### exists()

```ts
exists(path): Promise<boolean>;
```

Defined in: [index.ts:263](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L263)

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

Defined in: [index.ts:261](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L261)

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

Defined in: [index.ts:262](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/evals/src/index.ts#L262)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |

#### Returns

`Promise`\<`void`\>
