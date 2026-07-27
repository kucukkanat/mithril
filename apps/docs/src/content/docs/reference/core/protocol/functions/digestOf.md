---
editUrl: false
next: false
prev: false
title: "digestOf"
---

```ts
function digestOf(def): string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:174](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L174)

Content digest of a tool definition — its identity, used to make re-registration idempotent.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `def` | [`UndigestedToolDefinition`](/mithril/reference/core/protocol/type-aliases/undigestedtooldefinition/) | the definition, without its `digest` field. |

## Returns

`string`

an 8-character hex FNV-1a hash of the definition's canonical JSON.

## Remarks

**Identity, not integrity.** FNV-1a is a fast non-cryptographic hash: it answers "is this the same
definition?", not "was this definition tampered with". If definitions cross a trust boundary, sign the
carrier (that is what `Persistence.seal` is for) rather than trusting this value.
