---
editUrl: false
next: false
prev: false
title: "kvToolStore"
---

```ts
function kvToolStore(kv, opts?): ToolStore;
```

Defined in: [persistence.ts:52](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/authoring/src/persistence.ts#L52)

A [ToolStore](/mithril/reference/authoring/persistence/interfaces/toolstore/) over any KeyValue.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `kv` | `KeyValue` | the backing store (`memoryKv`, `indexedDbKv`, `sqliteNodeKv`, …). |
| `opts` | \{ `namespace?`: `string`; \} | `namespace` overrides the key prefix (default `"mithril:tools:v1"`). |
| `opts.namespace?` | `string` | - |

## Returns

[`ToolStore`](/mithril/reference/authoring/persistence/interfaces/toolstore/)

a scoped tool store.

## Remarks

Keys are `<ns>:<scope>:t:<name>` for records and `<ns>:<scope>:__index` for the name list, because
`KeyValue` cannot enumerate. `save` writes the record *before* indexing it, so an interrupted write
leaves an unreferenced record rather than an index entry pointing at nothing — a garbage record is
invisible, a dangling pointer is a load-time failure.

The `v1` in the prefix is the record format. A future incompatible ToolDefinition shape bumps it
and old records simply stop loading; a cache of agent-authored tools does not warrant a migration path.

## Example

```ts
import { memoryKv } from "@mithril/kv";
import { kvToolStore } from "@mithril/authoring/persistence";

const store = kvToolStore(memoryKv());
```
