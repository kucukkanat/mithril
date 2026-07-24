---
editUrl: false
next: false
prev: false
title: "memoryFileSystem"
---

```ts
function memoryFileSystem(now?): FileSystem;
```

Defined in: [packages/fs/src/index.ts:85](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/fs/src/index.ts#L85)

Create an in-memory [FileSystem](/mithril/reference/fs/index/interfaces/filesystem/) — works in any runtime, holds nothing on disk.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `now` | () => `number` | `Date.now` | Clock used for `lastModified` timestamps; defaults to `Date.now`. Injectable for deterministic tests. |

## Returns

[`FileSystem`](/mithril/reference/fs/index/interfaces/filesystem/)

A fresh, empty rooted filesystem backed by a `Map`.

## Remarks

Directories are implicit: they exist as long as a file lives under them, so [FileSystem.mkdir](/mithril/reference/fs/index/interfaces/filesystem/#mkdir)
is a no-op. Ideal for tests and ephemeral scratch space.

## Example

```ts
const fs = memoryFileSystem();
await fs.writeFile("notes/todo.txt", "buy milk");
await fs.readText("notes/todo.txt"); // "buy milk"
for await (const e of fs.list("notes")) console.log(e.name, e.kind); // "todo.txt" "file"
```
