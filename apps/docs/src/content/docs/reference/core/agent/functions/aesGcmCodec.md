---
editUrl: false
next: false
prev: false
title: "aesGcmCodec"
---

```ts
function aesGcmCodec(key): SealCodec;
```

Defined in: [packages/core/src/agent/seal.ts:98](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/core/src/agent/seal.ts#L98)

Build an AES-GCM [SealCodec](/reference/core/agent/interfaces/sealcodec/) (`id: "aesgcm"`) for at-rest confidentiality of sealed payloads.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | the AES-GCM key (see [generateEncryptionKey](/reference/core/agent/functions/generateencryptionkey/)). |

## Returns

[`SealCodec`](/reference/core/agent/interfaces/sealcodec/)

a codec that encrypts on `encode` and decrypts on `decode`, prepending a random 12-byte IV to
each ciphertext (OQ-2 — for checkpoints holding PII).

## Remarks

Pass it to both [seal](/reference/core/agent/functions/seal/) and [open](/reference/core/agent/functions/open/); the envelope's recorded codec id must match on open.
