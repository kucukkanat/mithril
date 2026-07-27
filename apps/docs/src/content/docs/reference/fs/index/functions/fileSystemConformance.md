---
editUrl: false
next: false
prev: false
title: "fileSystemConformance"
---

```ts
function fileSystemConformance(make, t): void;
```

Defined in: [packages/fs/src/index.ts:170](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/fs/src/index.ts#L170)

Run the shared behavioral conformance suite against any [FileSystem](/mithril/reference/fs/index/interfaces/filesystem/) implementation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<[`FileSystem`](/mithril/reference/fs/index/interfaces/filesystem/)\> | Factory that produces a fresh, empty filesystem for each test. |
| `t` | [`FsTestAdapter`](/mithril/reference/fs/index/interfaces/fstestadapter/) | [FsTestAdapter](/mithril/reference/fs/index/interfaces/fstestadapter/) bridging the suite to your test runner. |

## Returns

`void`

## Remarks

Covers write/read round-trips, immediate-children listing, recursive removal, and rejection of
path traversal that escapes the root. Use it to validate custom adapters.
