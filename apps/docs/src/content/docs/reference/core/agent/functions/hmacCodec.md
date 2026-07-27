---
editUrl: false
next: false
prev: false
title: "hmacCodec"
---

```ts
function hmacCodec(): SealCodec;
```

Defined in: [packages/core/src/agent/seal.ts:67](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/agent/seal.ts#L67)

The identity [SealCodec](/mithril/reference/core/agent/interfaces/sealcodec/) (`id: "hmac"`): integrity-only, leaving the payload bytes untransformed.

## Returns

[`SealCodec`](/mithril/reference/core/agent/interfaces/sealcodec/)

a codec that passes bytes through unchanged; the outer HMAC provides tamper-evidence.
