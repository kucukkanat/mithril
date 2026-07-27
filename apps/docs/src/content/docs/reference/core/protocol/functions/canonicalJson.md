---
editUrl: false
next: false
prev: false
title: "canonicalJson"
---

```ts
function canonicalJson(v): string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:159](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L159)

Canonical JSON for a [JsonValue](/mithril/reference/core/protocol/type-aliases/jsonvalue/) — object keys sorted, so structurally equal values stringify
identically.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `v` | [`JsonValue`](/mithril/reference/core/protocol/type-aliases/jsonvalue/) | any JSON value. |

## Returns

`string`

a deterministic string form, suitable for hashing or equality.
