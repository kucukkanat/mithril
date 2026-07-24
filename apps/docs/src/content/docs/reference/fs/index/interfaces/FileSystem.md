---
editUrl: false
next: false
prev: false
title: "FileSystem"
---

Defined in: [packages/fs/src/index.ts:31](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L31)

The rooted, async filesystem contract shared by every `@mithril/fs` adapter.

## Remarks

Paths are relative to the adapter's root; a path that escapes it throws an [FsError](/mithril/reference/fs/index/classes/fserror/).
Missing entries also throw [FsError](/mithril/reference/fs/index/classes/fserror/) (with an `ENOENT`-style message for the in-memory adapter).

## Methods

### exists()

```ts
exists(path): Promise<boolean>;
```

Defined in: [packages/fs/src/index.ts:43](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L43)

Resolve `true` if a file or directory exists at `path`, `false` otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`boolean`\>

***

### list()

```ts
list(dir): AsyncIterable<{
  kind: FileKind;
  name: string;
}>;
```

Defined in: [packages/fs/src/index.ts:39](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L39)

Asynchronously yield the immediate children of `dir` (not recursive), each with its [FileKind](/mithril/reference/fs/index/type-aliases/filekind/).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dir` | `string` |

#### Returns

`AsyncIterable`\<\{
  `kind`: [`FileKind`](/mithril/reference/fs/index/type-aliases/filekind/);
  `name`: `string`;
\}\>

***

### mkdir()

```ts
mkdir(path): Promise<void>;
```

Defined in: [packages/fs/src/index.ts:45](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L45)

Create the directory at `path` (recursive). No-op for the in-memory adapter, where directories are implicit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`void`\>

***

### readFile()

```ts
readFile(path): Promise<Uint8Array<ArrayBufferLike>>;
```

Defined in: [packages/fs/src/index.ts:35](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L35)

Read a file's raw bytes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Throws

[FsError](/mithril/reference/fs/index/classes/fserror/) if the path is missing or escapes the root.

***

### readText()

```ts
readText(path): Promise<string>;
```

Defined in: [packages/fs/src/index.ts:33](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L33)

Read a file's contents as a UTF-8 decoded string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`string`\>

#### Throws

[FsError](/mithril/reference/fs/index/classes/fserror/) if the path is missing or escapes the root.

***

### remove()

```ts
remove(path): Promise<void>;
```

Defined in: [packages/fs/src/index.ts:47](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L47)

Remove `path` recursively; removing a missing path is not an error.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`void`\>

***

### stat()

```ts
stat(path): Promise<{
  kind: FileKind;
  lastModified: number;
  size: number;
}>;
```

Defined in: [packages/fs/src/index.ts:41](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L41)

Return `size` (bytes), `lastModified` (epoch ms), and [FileKind](/mithril/reference/fs/index/type-aliases/filekind/) for `path`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<\{
  `kind`: [`FileKind`](/mithril/reference/fs/index/type-aliases/filekind/);
  `lastModified`: `number`;
  `size`: `number`;
\}\>

#### Throws

[FsError](/mithril/reference/fs/index/classes/fserror/) if missing.

***

### writeFile()

```ts
writeFile(path, data): Promise<void>;
```

Defined in: [packages/fs/src/index.ts:37](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L37)

Write bytes or a string to `path`, creating parent directories as needed. Strings are UTF-8 encoded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |

#### Returns

`Promise`\<`void`\>
