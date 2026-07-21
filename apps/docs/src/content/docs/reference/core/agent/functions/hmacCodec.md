---
editUrl: false
next: false
prev: false
title: "hmacCodec"
---

```ts
function hmacCodec(): SealCodec;
```

Defined in: packages/core/src/agent/seal.ts:67

The identity [SealCodec](/reference/core/agent/interfaces/sealcodec/) (`id: "hmac"`): integrity-only, leaving the payload bytes untransformed.

## Returns

[`SealCodec`](/reference/core/agent/interfaces/sealcodec/)

a codec that passes bytes through unchanged; the outer HMAC provides tamper-evidence.
