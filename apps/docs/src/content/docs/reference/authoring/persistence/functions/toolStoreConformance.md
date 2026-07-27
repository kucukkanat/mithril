---
editUrl: false
next: false
prev: false
title: "toolStoreConformance"
---

```ts
function toolStoreConformance(make, t): void;
```

Defined in: [persistence.ts:147](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/persistence.ts#L147)

The shared conformance suite every [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/) implementation must pass.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `make` | () => `Promise`\<[`ToolStore`](/mithril/reference/authoring/persistence/interfaces/toolstore/)\> | factory producing a fresh, empty store per case. |
| `t` | [`ToolStoreTestAdapter`](/mithril/reference/authoring/persistence/interfaces/toolstoretestadapter/) | adapter bridging to the host test runner. |

## Returns

`void`

## Example

```ts
import { expect, test } from "bun:test";
import { memoryKv } from "@mithril/kv";
import { kvToolStore, toolStoreConformance } from "@mithril/authoring/persistence";

toolStoreConformance(async () => kvToolStore(memoryKv()), { test, assertEqual: (a, b) => expect(a).toEqual(b) });
```
