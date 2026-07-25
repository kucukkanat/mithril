---
editUrl: false
next: false
prev: false
title: "canonicalJson"
---

```ts
function canonicalJson(v): string;
```

Defined in: packages/core/src/protocol/tool-registry.ts:159

Canonical JSON for a [JsonValue](/mithril/reference/core/protocol/type-aliases/jsonvalue/) — object keys sorted, so structurally equal values stringify
identically.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `v` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | any JSON value. |

## Returns

`string`

a deterministic string form, suitable for hashing or equality.
