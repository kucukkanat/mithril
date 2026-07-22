---
editUrl: false
next: false
prev: false
title: "TrajectoryFs"
---

Defined in: [index.ts:260](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L260)

The minimal `FileSystem` surface [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) needs — satisfied by any `@mithril/fs` backend.

## Methods

### exists()

```ts
exists(path): Promise<boolean>;
```

Defined in: [index.ts:263](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L263)

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

Defined in: [index.ts:261](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L261)

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

Defined in: [index.ts:262](https://github.com/kucukkanat/mithril/blob/652e28d3d2a93a67b8f3f5cced7a1832f5bf3810/packages/evals/src/index.ts#L262)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |

#### Returns

`Promise`\<`void`\>
