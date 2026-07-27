---
editUrl: false
next: false
prev: false
title: "generateStateKey"
---

```ts
function generateStateKey(rt?): Promise<CryptoKey>;
```

Defined in: [packages/core/src/agent/seal.ts:43](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/seal.ts#L43)

Generate an extractable HMAC-SHA-256 signing key for sealing tokens.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rt?` | [`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |

## Returns

`Promise`\<`CryptoKey`\>

a `CryptoKey` usable for `sign`/`verify`, e.g. wrapped in a [singleKeyring](/mithril/reference/core/agent/functions/singlekeyring/).

## Throws

[StateIntegrityError](/mithril/reference/core/agent/classes/stateintegrityerror/) when `crypto.subtle` is unavailable (insecure context).
