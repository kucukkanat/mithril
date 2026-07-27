---
editUrl: false
next: false
prev: false
title: "fsToolStore"
---

```ts
function fsToolStore(fs, opts?): ToolStore;
```

Defined in: [persistence.ts:95](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/persistence.ts#L95)

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/) over any FileSystem, one JSON file per tool.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fs` | `FileSystem` | the backing filesystem (`memoryFileSystem`, `nodeFileSystem`, `opfsFileSystem`). |
| `opts` | \{ `dir?`: `string`; \} | `dir` overrides the root (default `".mithril/tools"`). |
| `opts.dir?` | `string` | - |

## Returns

[`ToolStore`](/mithril/reference/authoring/persistence/interfaces/toolstore/)

a scoped tool store.

## Remarks

Laid out as `<dir>/<scope>/<name>.json`, so the toolbox is reviewable with ordinary tools. No index is
needed — `FileSystem` can enumerate. Path traversal is doubly prevented: `FileSystem` is rooted and
throws on an escaping path, and an authored tool's name cannot contain a separator in the first place.
