---
editUrl: false
next: false
prev: false
title: "nodeFileSystem"
---

```ts
function nodeFileSystem(rootOrOpts): FileSystem;
```

Defined in: [packages/fs/src/node.ts:26](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/fs/src/node.ts#L26)

Create a [FileSystem](/reference/fs/index/interfaces/filesystem/) backed by the local disk, confined to `root`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rootOrOpts` | \| `string` \| \{ `root`: `string`; \} | the base directory all paths are resolved against (or `{ root }`); created lazily on first write. |

## Returns

[`FileSystem`](/reference/fs/index/interfaces/filesystem/)

A rooted filesystem over `root`.

## Remarks

**Server-only** — requires `node:fs/promises`; runs on Node 18+ and Bun. Any path that resolves
outside `root` is rejected with an [FsError](/reference/fs/index/classes/fserror/), giving the same confinement guarantee as the
in-memory and OPFS adapters. Writes create parent directories automatically.

## Throws

FsError on any operation whose path escapes `root`.

## Example

```ts
import { nodeFileSystem } from "@mithril/fs/node";

const fs = nodeFileSystem("./workspace");
await fs.writeFile("out/result.json", JSON.stringify({ ok: true }));
const text = await fs.readText("out/result.json");
```
