---
editUrl: false
next: false
prev: false
title: "nodeFileSystem"
---

```ts
function nodeFileSystem(root): FileSystem;
```

Defined in: packages/fs/src/node.ts:25

Create a [FileSystem](/reference/fs/index/interfaces/filesystem/) backed by the local disk, confined to `root`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `root` | `string` | Base directory all paths are resolved against; created lazily on first write. |

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
