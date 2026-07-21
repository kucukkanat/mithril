---
editUrl: false
next: false
prev: false
title: "TrajectoryFs"
---

Defined in: index.ts:194

The minimal `FileSystem` surface [fsTrajectoryStore](/reference/evals/functions/fstrajectorystore/) needs — satisfied by any `@mithril/fs` backend.

## Methods

### exists()

```ts
exists(path): Promise<boolean>;
```

Defined in: index.ts:197

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

Defined in: index.ts:195

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

Defined in: index.ts:196

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |

#### Returns

`Promise`\<`void`\>
