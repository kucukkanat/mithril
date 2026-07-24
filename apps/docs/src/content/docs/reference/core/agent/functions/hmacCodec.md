---
editUrl: false
next: false
prev: false
title: "hmacCodec"
---

```ts
function hmacCodec(): SealCodec;
```

Defined in: [packages/core/src/agent/seal.ts:67](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/core/src/agent/seal.ts#L67)

The identity [SealCodec](/mithril/reference/core/agent/interfaces/sealcodec/) (`id: "hmac"`): integrity-only, leaving the payload bytes untransformed.

## Returns

[`SealCodec`](/mithril/reference/core/agent/interfaces/sealcodec/)

a codec that passes bytes through unchanged; the outer HMAC provides tamper-evidence.
