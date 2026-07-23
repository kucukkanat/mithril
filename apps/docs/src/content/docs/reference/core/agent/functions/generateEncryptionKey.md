---
editUrl: false
next: false
prev: false
title: "generateEncryptionKey"
---

```ts
function generateEncryptionKey(rt?): Promise<CryptoKey>;
```

Defined in: [packages/core/src/agent/seal.ts:86](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/agent/seal.ts#L86)

Generate an extractable AES-GCM-256 key for the [aesGcmCodec](/reference/core/agent/functions/aesgcmcodec/) confidentiality codec.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rt?` | [`RuntimeAdapter`](/reference/core/protocol/interfaces/runtimeadapter/) | optional [RuntimeAdapter](/reference/core/protocol/interfaces/runtimeadapter/) providing `subtle`; falls back to `globalThis.crypto.subtle`. |

## Returns

`Promise`\<`CryptoKey`\>

a `CryptoKey` usable for `encrypt`/`decrypt`.

## Throws

[StateIntegrityError](/reference/core/agent/classes/stateintegrityerror/) when `crypto.subtle` is unavailable (insecure context).
