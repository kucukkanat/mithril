---
editUrl: false
next: false
prev: false
title: "generateEncryptionKey"
---

```ts
function generateEncryptionKey(rt?): Promise<CryptoKey>;
```

Defined in: [packages/core/src/agent/seal.ts:86](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/seal.ts#L86)

Generate an extractable AES-GCM-256 key for the [aesGcmCodec](/mithril/reference/core/agent/functions/aesgcmcodec/) confidentiality codec.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rt?` | [`RuntimeAdapter`](/mithril/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/mithril/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |

## Returns

`Promise`\<`CryptoKey`\>

a `CryptoKey` usable for `encrypt`/`decrypt`.

## Throws

[StateIntegrityError](/mithril/reference/core/agent/classes/stateintegrityerror/) when `crypto.subtle` is unavailable (insecure context).
